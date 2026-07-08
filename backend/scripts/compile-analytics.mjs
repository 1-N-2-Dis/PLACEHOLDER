// Analytics batch-compilation pipeline for GuidHer.
// Role: pull active `reports` docs → aggregate condition counts per zone → issue a single
// structured Gemini prompt per zone → write results to `barangay_analytics_cache` and
// `platform_transparency_stats`. This is the ONLY place Gemini is called for analytics;
// all public API routes read the cached output at O(1) without touching the AI model.
//
// Designed to run:
//   (a) Manually before a demo — PowerShell emulator:
//         $env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8081"; $env:GEMINI_API_KEY="<key>"
//         node backend/scripts/compile-analytics.mjs
//   (b) Manually against real Firestore (Render / production):
//         $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\serviceAccount.json"
//         $env:GEMINI_API_KEY="<key>"
//         node backend/scripts/compile-analytics.mjs
//   (c) As the last step in the Docker seed chain — docker-compose.yml passes
//       GEMINI_API_KEY from the host env, so this is opt-in (blank key → AI_ENABLED=false).
//
// Free-tier guard: Gemini is called at most once per zone (25 max), in series with a 2-second
// delay between requests, so we never exceed the free-tier RPM cap during a seeding run.
//
// BR-001: no crime labels in any generated copy. The system instruction enforces conditions-only
// language (lighting, visibility, crowds) — same constraint as submitReport's classify prompt.
// BR-006: Gemini never invents data; it structures only the aggregated counts passed to it.
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// ─────────────────────────────────────────────────────────────────────────────
// Initialisation
// ─────────────────────────────────────────────────────────────────────────────

const useEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;
initializeApp(
  useEmulator
    ? { projectId: process.env.GCLOUD_PROJECT || 'demo-saferroute' }
    : { credential: applicationDefault() },
);
const db = getFirestore();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const AI_ENABLED = !!GEMINI_API_KEY;

if (!AI_ENABLED) {
  console.warn('  ⚠  GEMINI_API_KEY not set — AI analysis will be skipped and placeholder');
  console.warn('     text will be written to the cache instead. Set the key and re-run to');
  console.warn('     populate real executive summaries and mitigations.\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// Zone registry — 25 coordinate anchors that map to the CSV `location` strings.
// Kept here so the pipeline is self-contained without needing the frontend module.
// ─────────────────────────────────────────────────────────────────────────────

const ZONES = [
  'Teresa Street',
  'LRT-2 Pureza Station',
  'Pureza Street',
  'LRT-2 Legarda Station',
  'Magsaysay Boulevard',
  'Recto Avenue',
  'Legarda Street',
  'España Boulevard',
  'Earnshaw Street',
  'Morayta Street',
  'Lacson Avenue',
  'Anonas Street',
  'Hipodromo',
  'NDC Compound',
  'V. Mapa',
  'P. Campa',
  'Stop & Shop',
  'Recto Legarda',
  'Sampaloc',
  'Sta. Mesa',
  'LRT-2 V. Mapa Station',
  'LRT-2 J. Ruiz Station',
  'LRT-2 Gilmore Station',
  'LRT-2 Betty Go-Belmonte Station',
  'LRT-2 Araneta-Cubao Station',
];

// Firestore doc IDs must not contain '/' — encode slashes and spaces consistently.
function locationToDocId(location) {
  return location.replace(/\//g, '-').replace(/\s+/g, '_').toLowerCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// Condition-type → metric bucket mapping.
// Reports use the closed enum from BR-001; we expand that to the richer bucket
// names the analytics schema expects.
// ─────────────────────────────────────────────────────────────────────────────

// Maps each conditionType to one of the four analytics metric keys.
const CONDITION_TO_METRIC = {
  poor_lighting: 'poor_lighting_count',
  no_crowd: 'low_foot_traffic_count',
  recent_incident: 'unsafe_infrastructure_count',
};

// ─────────────────────────────────────────────────────────────────────────────
// Report ingestion — pull all reports from Firestore and bucket them by location.
// We use the `segmentId` as a proxy for zone when a `location` field is absent
// (pre-analytics reports only carry segmentId), mapping known segment prefixes to
// zone names. New reports submitted via submitReport carry a `segmentName` in the
// request but it is not persisted — we derive location from the segmentId prefix.
// ─────────────────────────────────────────────────────────────────────────────

// Coarse segmentId → zone mapping so legacy reports (no location field) count in
// the right bucket. Covers the 8 named segments from seed-segments.mjs.
const SEGMENT_TO_ZONE = {
  seg_teresa_st: 'Teresa Street',
  seg_teresa_wellused_1: 'Teresa Street',
  seg_teresa_wellused_2: 'Teresa Street',
  seg_pureza_south_exit: 'LRT-2 Pureza Station',
  seg_pureza_approaches: 'LRT-2 Pureza Station',
  seg_pureza_st_1: 'Pureza Street',
  seg_pureza_st_2: 'Pureza Street',
  seg_pureza_st_3: 'Pureza Street',
  seg_pureza_st_4: 'Pureza Street',
  seg_pureza_st_5: 'Pureza Street',
  seg_pureza_st_6: 'Pureza Street',
  seg_legarda_estero: 'LRT-2 Legarda Station',
  seg_recto_legarda: 'Recto Legarda',
  seg_vmapa_sm: 'V. Mapa',
  seg_pcampa_altroute: 'P. Campa',
  seg_magsaysay_jeeps: 'Magsaysay Boulevard',
  seg_anonas_st_1: 'Anonas Street',
  seg_anonas_st_2: 'Anonas Street',
  seg_anonas_st_3: 'Anonas Street',
  seg_anonas_st_4: 'Anonas Street',
  seg_anonas_st_5: 'Anonas Street',
  seg_anonas_st_6: 'Anonas Street',
  seg_anonas_st_7: 'Anonas Street',
  seg_anonas_st_8: 'Anonas Street',
  seg_hipodromo_st_1: 'Hipodromo',
  seg_hipodromo_st_2: 'Hipodromo',
  seg_hipodromo_st_3: 'Hipodromo',
  seg_hipodromo_st_4: 'Hipodromo',
  seg_hipodromo_st_5: 'Hipodromo',
  seg_hipodromo_st_6: 'Hipodromo',
  seg_hipodromo_st_7: 'Hipodromo',
};

function resolveZone(doc) {
  // If the report was submitted with a location field (future field), prefer it.
  const loc = doc.get('location');
  if (loc && ZONES.includes(loc)) return loc;

  // Fall back to segmentId prefix mapping.
  const segId = doc.get('segmentId') || '';
  if (SEGMENT_TO_ZONE[segId]) return SEGMENT_TO_ZONE[segId];

  // Dynamic segment ids: seg_osm_<lat>_<lng>_<slug> — assign to Sta. Mesa as generic zone.
  if (segId.startsWith('seg_osm_')) return 'Sta. Mesa';

  return null; // Unclassifiable — counted in global totals but not zone totals.
}

async function fetchAndBucketReports() {
  console.log('  Fetching all reports from Firestore...');
  const snap = await db.collection('reports').get();
  const total = snap.size;
  console.log(`  ${total} reports found.`);

  // zone name → { poor_lighting_count, unsafe_infrastructure_count, low_foot_traffic_count,
  //                other_scams_count, total, notes[] }
  const buckets = {};
  for (const zone of ZONES) {
    buckets[zone] = {
      poor_lighting_count: 0,
      unsafe_infrastructure_count: 0,
      low_foot_traffic_count: 0,
      other_scams_count: 0,
      total: 0,
      notes: [],
    };
  }

  let spam_count = 0;
  let duplicate_count = 0;

  for (const doc of snap.docs) {
    const conditionType = doc.get('conditionType');
    const corroboration = doc.get('corroborationCount') || 1;
    const note = doc.get('note');
    const verdict = doc.get('verdict'); // present on AI-moderated reports

    // Count platform transparency stats.
    if (verdict === 'spam') { spam_count++; continue; } // excluded from zone counts
    if (corroboration > 1) duplicate_count += corroboration - 1;

    const zone = resolveZone(doc);
    if (!zone) continue;

    const metricKey = CONDITION_TO_METRIC[conditionType] || 'other_scams_count';
    buckets[zone][metricKey] += corroboration;
    buckets[zone].total += corroboration;
    if (note && typeof note === 'string' && note.trim()) {
      buckets[zone].notes.push(note.trim());
    }
  }

  return { buckets, total, spam_count, duplicate_count };
}

// ─────────────────────────────────────────────────────────────────────────────
// Gemini integration — single structured call per zone.
// ─────────────────────────────────────────────────────────────────────────────

// System instruction from POTENTIAL_ARCHITECTURE_PLAN.md §5 — verbatim, plus the
// BR-001 reinforcement line ("do not mention crime labels") already present there.
const SYSTEM_INSTRUCTION = `
You are an expert urban planning and public safety data analyst for Metro Manila.
Analyze the provided raw infrastructure vulnerability counts for a specific barangay corridor.
Output a strict, professional JSON object with exactly two keys:
1. "executive_summary": A concise, 3-sentence summary of the environmental conditions in Taglish.
2. "actionable_mitigations": An array of exactly 3 low-cost, fixable physical solutions the local Barangay can execute immediately.
Do not mention crime labels or create panic-inducing language. Focus strictly on environmental conditions (lighting, visibility, crowds).
`.trim();

const ANALYSIS_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    executive_summary: {
      type: SchemaType.STRING,
      description: '3-sentence Taglish summary of the zone\'s environmental conditions.',
    },
    actionable_mitigations: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Exactly 3 low-cost, immediately actionable physical improvements the Barangay can execute.',
    },
  },
  required: ['executive_summary', 'actionable_mitigations'],
};

function buildAnalysisPrompt(location, metrics) {
  return [
    `Zone: "${location}"`,
    '',
    'Aggregated infrastructure vulnerability report counts:',
    `- Poor lighting incidents: ${metrics.poor_lighting_count}`,
    `- Unsafe infrastructure incidents: ${metrics.unsafe_infrastructure_count}`,
    `- Low foot traffic / isolation reports: ${metrics.low_foot_traffic_count}`,
    `- Other environmental concerns: ${metrics.other_scams_count}`,
    `- Total weighted reports: ${metrics.total}`,
    '',
    metrics.notes.length > 0
      ? `Sample community notes (${Math.min(metrics.notes.length, 5)} of ${metrics.notes.length}):\n${metrics.notes.slice(0, 5).map((n, i) => `${i + 1}. "${n}"`).join('\n')}`
      : 'No community notes available for this zone.',
  ].join('\n');
}

// Placeholder used when AI is disabled (no key) or when a zone has zero reports.
function buildPlaceholderAnalysis(location, hasData) {
  if (!hasData) {
    return {
      executive_summary: `Ang zone na "${location}" ay kasalukuyang walang naitalagang community reports. Walang vulnerability data na available para sa panahon na ito. I-check muli pagkatapos mag-submit ng mga bagong ulat ang komunidad.`,
      actionable_mitigations: [
        'Magsagawa ng barangay survey para ma-assess ang kasalukuyang kalagayan ng ilaw sa kalsada.',
        'Mag-coordinate sa lokal na tanggapan para sa regular na pagsisiyasat ng pedestrian safety infrastructure.',
        'Hikayatin ang mga komunidad na mag-submit ng mga ulat tungkol sa kondisyon ng lugar para makapag-ipon ng baseline data.',
      ],
    };
  }
  return {
    executive_summary: `Ang zone na "${location}" ay may naitalagang community reports tungkol sa environmental safety conditions. Available ang aggregated data ngunit ang AI analysis ay hindi pa nai-generate — i-set ang GEMINI_API_KEY at i-rerun ang compile-analytics.mjs para ma-populate ang executive summary. Ang mga raw counts ay available sa metrics field ng cache document.`,
    actionable_mitigations: [
      'I-set ang GEMINI_API_KEY environment variable at i-rerun ang compile-analytics.mjs para ma-generate ang AI-powered mitigations.',
      'Tingnan ang metrics.poor_lighting_count, unsafe_infrastructure_count, at low_foot_traffic_count para sa manual na pagsusuri.',
      'Makipag-coordinate sa lokal na tanggapan base sa naitalagang vulnerability data para sa zone na ito.',
    ],
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function analyzeZoneWithGemini(genAI, location, metrics) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: ANALYSIS_SCHEMA,
    },
  });

  const prompt = buildAnalysisPrompt(location, metrics);
  const result = await model.generateContent(prompt);
  const parsed = JSON.parse(result.response.text());

  // Validate the response shape before trusting it.
  if (
    typeof parsed.executive_summary !== 'string' ||
    !Array.isArray(parsed.actionable_mitigations) ||
    parsed.actionable_mitigations.length !== 3
  ) {
    throw new Error(`Gemini returned unexpected shape for zone "${location}"`);
  }
  return parsed;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cache writers
// ─────────────────────────────────────────────────────────────────────────────

async function writeAnalyticsCache(location, metrics, aiAnalysis, batchRef) {
  const docId = locationToDocId(location);
  const ref = db.collection('barangay_analytics_cache').doc(docId);
  batchRef.set(ref, {
    location,
    last_updated: new Date().toISOString(),
    metrics: {
      poor_lighting_count: metrics.poor_lighting_count,
      unsafe_infrastructure_count: metrics.unsafe_infrastructure_count,
      low_foot_traffic_count: metrics.low_foot_traffic_count,
      other_scams_count: metrics.other_scams_count,
    },
    ai_analysis: {
      executive_summary: aiAnalysis.executive_summary,
      actionable_mitigations: aiAnalysis.actionable_mitigations,
    },
  });
  return docId;
}

async function writeTransparencyStats(stats) {
  const ref = db.collection('platform_transparency_stats').doc('global');
  await ref.set({
    total_community_reports_processed: stats.total,
    ai_moderation_rejections_spam: stats.spam_count,
    duplicate_corroborations_merged: stats.duplicate_count,
    generated_barangay_briefs_count: stats.briefs_generated,
    last_processed_timestamp: new Date().toISOString(),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Main pipeline
// ─────────────────────────────────────────────────────────────────────────────

async function compile() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('GuidHer Analytics Compilation Pipeline');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Step 1 — fetch and bucket all reports.
  const { buckets, total, spam_count, duplicate_count } = await fetchAndBucketReports();

  const activeZones = ZONES.filter((z) => buckets[z].total > 0);
  const emptyZones = ZONES.filter((z) => buckets[z].total === 0);
  console.log(`\n  Active zones (have reports): ${activeZones.length}`);
  console.log(`  Empty zones (no reports yet): ${emptyZones.length}`);

  // Step 2 — call Gemini for each active zone, write all results in a batch.
  const genAI = AI_ENABLED ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
  const batch = db.batch();
  let aiCallCount = 0;
  let briefsGenerated = 0;

  console.log('\n  Processing zones...\n');

  for (const zone of ZONES) {
    const metrics = buckets[zone];
    const hasData = metrics.total > 0;

    let aiAnalysis;
    if (AI_ENABLED && hasData) {
      try {
        process.stdout.write(`  [AI] ${zone.padEnd(38)} `);
        aiAnalysis = await analyzeZoneWithGemini(genAI, zone, metrics);
        aiCallCount++;
        console.log(`✓  (${metrics.total} reports)`);

        // Free-tier guard: 2s delay between Gemini calls to stay under RPM limits.
        // Active zones are typically 5–15 out of 25, so total delay is well under 30s.
        if (aiCallCount < activeZones.length) await sleep(2000);
      } catch (err) {
        console.log(`✗  Gemini failed: ${err.message} — using placeholder`);
        aiAnalysis = buildPlaceholderAnalysis(zone, hasData);
      }
    } else {
      const label = hasData ? '[placeholder – no key]' : '[no data]';
      console.log(`  [--] ${zone.padEnd(38)} ${label}`);
      aiAnalysis = buildPlaceholderAnalysis(zone, hasData);
    }

    await writeAnalyticsCache(zone, metrics, aiAnalysis, batch);
    briefsGenerated++;
  }

  // Commit all 25 zone cache documents in a single batch write.
  console.log('\n  Committing analytics cache to Firestore...');
  await batch.commit();
  console.log(`  ✓ ${briefsGenerated} barangay_analytics_cache documents written.`);

  // Step 3 — write platform transparency stats.
  console.log('  Writing platform_transparency_stats...');
  await writeTransparencyStats({ total, spam_count, duplicate_count, briefs_generated: briefsGenerated });
  console.log('  ✓ platform_transparency_stats/global document written.');

  // Summary.
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('COMPILATION COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Reports processed:          ${total}`);
  console.log(`  Spam excluded:              ${spam_count}`);
  console.log(`  Duplicate merges counted:   ${duplicate_count}`);
  console.log(`  Active zones analysed:      ${activeZones.length}`);
  console.log(`  Gemini calls made:          ${aiCallCount}`);
  console.log(`  Briefs written to cache:    ${briefsGenerated}`);
  console.log(`  Mode:                       ${useEmulator ? 'emulator' : 'production'}`);
  console.log(`  AI:                         ${AI_ENABLED ? 'enabled' : 'disabled (no GEMINI_API_KEY)'}`);
  console.log('');
}

compile().catch((err) => {
  console.error('\nCompilation failed:', err.message);
  process.exit(1);
});
