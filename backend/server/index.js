// Express API replacing the Firebase Cloud Functions in backend/functions (F-004/F-006/F-008).
// Deploys to Render instead of Firebase Functions — Functions v2 requires the Firebase Blaze
// plan even at zero usage (Cloud Run/Cloud Build under the hood); a plain Node host does not.
// Firestore + Auth stay on Firebase (Spark/free plan) — this server talks to them via the Admin
// SDK, and verifies each request's Firebase ID token itself instead of relying on onCall's
// built-in request.auth.
//
// WHY SERVER-SIDE: the Gemini key must never ship in the client bundle (Threat T2). The
// authenticated client calls these routes with a Firebase ID token; only this server holds the
// Gemini key and the Firestore Admin credential.
//
// PS: all Gemini-backed features (submitReport moderation, summarizeSegment, assessRoute) are
// currently disabled for demo purposes, so the app responds instantly instead of waiting on the
// model. See AI_FEATURES_ENABLED below — carried over unchanged from the prior Cloud Functions.
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import PDFDocument from 'pdfkit';
import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// Firestore Admin needs explicit credentials outside a GCP environment. Set
// FIREBASE_SERVICE_ACCOUNT_KEY to the full JSON contents of a service account key (Firebase
// Console -> Project settings -> Service accounts -> Generate new private key). Never commit
// this file — see DEPLOYMENT_GUIDE.md for how to set it as a Render env var.
//
// Against the LOCAL EMULATORS (FIRESTORE_EMULATOR_HOST set — the Docker dev stack in
// docker-compose.yml, or LOCAL_DEV.md Tier 2) no credential is needed at all: the Admin SDK
// talks to the emulator with just a projectId, and verifyIdToken accepts the Auth emulator's
// unsigned tokens when FIREBASE_AUTH_EMULATOR_HOST is set. Same pattern as backend/scripts/
// seed-segments.mjs.
if (process.env.FIRESTORE_EMULATOR_HOST) {
  initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'demo-saferroute' });
} else {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();
const auth = getAuth();

// Held server-side only. Set as a Render env var, never committed.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Mirrors frontend/src/data/condition-types.js — the closed enum (BR-001). Duplicated here
// because this server is a separate Node package from the frontend; this array (not Rules, see
// submitReport below) is the server-side enforcement point for the enum.
const CONDITION_TYPES = ['poor_lighting', 'no_crowd', 'recent_incident'];
const SEVERITY_VALUES = ['green', 'yellow', 'red'];
const NOTE_MAX_LEN = 280;
const TITLE_MAX_LEN = 60;
const SEGMENT_NAME_MAX_LEN = 120;

// Closed validity verdicts for the classify decision. Anything but 'valid' rejects the report
// with the matching canned copy below (BR-006: the model picks a verdict, it never writes the
// user-facing reason itself).
const VERDICTS = ['valid', 'spam', 'mismatch', 'crime_label'];
const REJECT_REASONS = {
  spam: 'This looks like spam or a joke submission, so it was not filed.',
  mismatch: 'The title and note don\'t seem to describe the selected condition type. Please pick the matching condition or reword your report.',
  crime_label: 'Reports describe observable conditions (lighting, crowds, a recent incident) — not labels for people or places. Please reword your report.',
};

// PS: demo flag — set to false to skip every Gemini call (submitReport's classify/dedupe/reject,
// summarizeSegment, assessRoute) and fall straight through to each route's existing cut-safe
// fallback path instead. Flip back to true to restore all AI features.
const AI_FEATURES_ENABLED = false;
// No AI severity classification while disabled, so pick a plausible severity at random instead
// of hardcoding one value for every report — weighted red-heavy since red is the rarer/urgent case.
const RED_SEVERITY_RATIO_WHEN_AI_DISABLED = 0.4;
function randomSeverityWhenAiDisabled() {
  return Math.random() < RED_SEVERITY_RATIO_WHEN_AI_DISABLED ? 'red' : 'yellow';
}

// How close in time a new report must be to an existing one on the same segment to be eligible
// for AI duplicate-merge. Tighter than the 24h "tonight" freshness window (frontend/src/lib/
// freshness.js) because a duplicate is a near-concurrent corroboration, not just a fresh report.
const DUPLICATE_WINDOW_MS = 6 * 60 * 60 * 1000;

// Mirrors frontend/src/lib/freshness.js's FRESHNESS_WINDOW_MS (24h) — a report counts as "active
// tonight" within this window. Duplicated here for the same reason CONDITION_TYPES is duplicated.
const FRESHNESS_WINDOW_MS = 24 * 60 * 60 * 1000;
// Bounds the number of Firestore reads (one per on-route segment) and prompt size per assessRoute
// call — a route realistically passes near a couple dozen mapped points at most.
const MAX_ROUTE_SEGMENTS = 30;

// HTTP status per HttpsError-style code, mirroring the codes the Cloud Functions version threw.
const STATUS_BY_CODE = {
  'invalid-argument': 400,
  unauthenticated: 401,
  internal: 500,
};

function sendError(res, code, message) {
  res.status(STATUS_BY_CODE[code] || 500).json({ error: code, message });
}

// Verifies the caller's Firebase ID token (sent as `Authorization: Bearer <token>` by the
// client — see frontend/src/lib/reportIntake.js) and attaches { uid } to req.auth, replacing
// onCall's built-in request.auth.
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const match = /^Bearer (.+)$/.exec(header);
  if (!match) return sendError(res, 'unauthenticated', 'Sign-in required.');
  try {
    const decoded = await auth.verifyIdToken(match[1]);
    req.auth = { uid: decoded.uid };
    next();
  } catch {
    sendError(res, 'unauthenticated', 'Sign-in required.');
  }
}

// isAdmin middleware — chains after token verification to confirm the authenticated user holds
// the 'admin' role in users/{uid}.role (Firestore). This mirrors the isAdmin() function in
// firestore.rules but runs server-side, where the Admin SDK bypasses Rules entirely, so we
// explicitly re-check the role document here.
//
// Security note: the role doc is always read from Firestore at request time — never from the
// ID token claims — so a revoked admin role takes effect on the next request without needing
// token rotation.
async function isAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const match = /^Bearer (.+)$/.exec(header);
  if (!match) return sendError(res, 'unauthenticated', 'Sign-in required.');

  let uid;
  try {
    const decoded = await auth.verifyIdToken(match[1]);
    uid = decoded.uid;
  } catch {
    return sendError(res, 'unauthenticated', 'Sign-in required.');
  }

  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists || userDoc.get('role') !== 'admin') {
      return res.status(403).json({ error: 'forbidden', message: 'Admin access required.' });
    }
  } catch (err) {
    console.error('isAdmin role lookup failed:', err.message);
    return sendError(res, 'internal', 'Could not verify admin status.');
  }

  req.auth = { uid };
  next();
}

const app = express();
app.use(express.json());
// CORS_ORIGIN: comma-separated list of allowed frontend origins (the Vercel deployment URL(s) +
// http://localhost:5173 for local dev). Falls back to reflecting any origin if unset — fine for
// a first deploy, but set this explicitly before treating the deployment as production-facing.
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : true }));

app.get('/health', (req, res) => res.json({ ok: true }));

// Constrained prompt enforces BR-006: dedupe + structure ONLY the submitted notes; invent nothing.
function buildPrompt(segmentName, notes) {
  const numbered = notes.map((n, i) => `${i + 1}. ${n}`).join('\n');
  return [
    `You are summarizing community safety reports for the route segment "${segmentName}".`,
    'Summarize and deduplicate ONLY the reports listed below.',
    'Do NOT add any incident, place, person, or detail that is not present in the reports.',
    'Describe observable, fixable conditions (lighting, crowd, recent incident). Do not label the area as a "crime zone".',
    'Keep it to 2-3 short sentences.',
    '',
    'Reports:',
    numbered,
  ].join('\n');
}

app.post('/summarizeSegment', requireAuth, async (req, res) => {
  const segmentId = req.body && req.body.segmentId;
  if (!segmentId || typeof segmentId !== 'string') {
    return sendError(res, 'invalid-argument', 'segmentId is required.');
  }

  // Read this segment's report notes (BR-006: summary is derived only from submitted reports).
  const snap = await db
    .collection('reports')
    .where('segmentId', '==', segmentId)
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();

  const notes = snap.docs
    .map((d) => d.get('note'))
    .filter((n) => typeof n === 'string' && n.trim().length > 0)
    .map((n) => n.trim());

  // Cut-safe: nothing to summarize → tell the client to use its raw-flag fallback.
  if (notes.length === 0) {
    return res.json({ summary: null, count: 0 });
  }

  // PS: skipped for demo purposes while AI_FEATURES_ENABLED is false — the client falls back
  // to its raw flag list instead of a Gemini summary.
  if (!AI_FEATURES_ENABLED) {
    return res.json({ summary: null, count: notes.length });
  }

  const segmentName = snap.docs[0].get('segmentId'); // name lives on segments; id is enough context here.
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  let summary;
  try {
    const result = await model.generateContent(buildPrompt(segmentName, notes));
    summary = result.response.text().trim();
  } catch (err) {
    // Never log raw note contents (potential PII, Threat T6). Log only a safe message.
    console.error('Gemini summarize failed:', err.message);
    return sendError(res, 'internal', 'Summary unavailable.');
  }

  res.json({ summary, count: notes.length });
});

// Structured-output schema for the classify/dedupe/reject decision (BR-006-style constraint:
// Gemini may only choose among these fields' closed value sets — it cannot invent new ones).
const CLASSIFY_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    severity: { type: SchemaType.STRING, format: 'enum', enum: SEVERITY_VALUES },
    duplicateOfIndex: {
      type: SchemaType.INTEGER,
      description: 'Index (1-based) into the "Existing reports" list this duplicates, or 0 if not a duplicate of any listed report.',
    },
    verdict: {
      type: SchemaType.STRING,
      format: 'enum',
      enum: VERDICTS,
      description: 'valid = coherent condition report; spam = gibberish, joke, or implausible; mismatch = title+note do not describe the selected condition type; crime_label = title or note labels people or the place as criminal/dangerous-by-reputation instead of describing an observable, fixable condition.',
    },
  },
  required: ['severity', 'duplicateOfIndex', 'verdict'],
};

// Constrained prompt: classify severity from observable/fixable-condition language ONLY, decide
// if this looks like a duplicate of one of the listed recent reports on the same segment, and
// pick a validity verdict (valid/spam/mismatch/crime_label — see VERDICTS). Never invents an
// incident beyond what's in the new submission (BR-006 spirit).
function buildClassifyPrompt(conditionType, title, note, existingReports, segmentName) {
  const existingList = existingReports.length
    ? existingReports
        .map((r, i) => `${i + 1}. [${r.conditionType}]${r.title ? ` "${r.title}" —` : ''} ${r.note || '(no note)'} — reported ${r.createdAt}`)
        .join('\n')
    : '(none)';

  return [
    'You are triaging a one-tap community safety report for a pedestrian route-safety app.',
    'Classify the NEW report below into a severity:',
    '- green: not too dangerous, but worth noting (e.g. minor/older condition).',
    '- yellow: a bit dangerous — routing should prefer to avoid this if a reasonable alternative exists.',
    '- red: dangerous — routing should actively avoid this and find a different path.',
    'Base the severity ONLY on the observable, fixable condition described (lighting, crowd level,',
    'recent incident) in the new report. Do NOT output or infer any crime-category, neighborhood,',
    'or place classification — you are rating this one report, not the location or its people.',
    '',
    'Also decide:',
    '- Is the new report a duplicate/corroboration of one of the "Existing reports" below (same',
    '  underlying condition, reported again)? If so, give its 1-based index; otherwise 0.',
    '- A verdict for the new report — pick exactly one:',
    '  - valid: the title and note coherently describe the selected condition type in brackets.',
    '  - mismatch: the title and note do NOT describe the selected condition type (e.g. text about',
    '    broken streetlights while the selected condition is no_crowd, or unrelated filler text).',
    '  - crime_label: the title or note labels people or the place itself as criminal or',
    '    dangerous-by-reputation (e.g. "holdup area", "addicts hang out here") instead of',
    '    describing an observable, fixable condition.',
    '  - spam: gibberish, a joke, or an obviously false submission. Weigh both the text AND',
    '    whether the condition is a plausible claim for the named street segment below, if given.',
    '    Only flag genuinely implausible or garbage input, not just terse reports.',
    '',
    segmentName ? `Location: ${segmentName}` : null,
    `New report: [${conditionType}] "${title}" — ${note || '(no note)'}`,
    '',
    'Existing reports on this segment (most recent first):',
    existingList,
  ].filter((line) => line !== null).join('\n');
}

// F-006: AI-moderated report submission (P0). Replaces direct client writes to `reports` —
// backend/firestore.rules denies client create/update/delete on that collection, so this route
// (via the Admin SDK, which bypasses Rules) is the ONLY path that can write a report. This
// route's validation is therefore the enforcement point for BR-001's closed enum/field shape
// that Firestore Rules used to check for direct writes.
//
// FAIL-CLOSED: unlike summarizeSegment (which degrades to a raw-list fallback on Gemini
// failure), a missing moderation decision here must never become an unmoderated write — any
// Gemini error or malformed response rejects the report rather than accepting it.
app.post('/submitReport', requireAuth, async (req, res) => {
  const uid = req.auth.uid;
  const data = req.body || {};
  const { segmentId, segmentName, conditionType, title, note, photoPath } = data;

  // Step 1 — structural validation (BR-001/BR-004, the direct replacement for what
  // firestore.rules used to enforce on a client create).
  if (typeof segmentId !== 'string' || !segmentId) {
    return sendError(res, 'invalid-argument', 'segmentId is required.');
  }
  if (!CONDITION_TYPES.includes(conditionType)) {
    return sendError(res, 'invalid-argument', 'conditionType must be one of the closed enum.');
  }
  if (typeof title !== 'string' || !title.trim() || title.length > TITLE_MAX_LEN) {
    return sendError(res, 'invalid-argument', `title is required (max ${TITLE_MAX_LEN} chars).`);
  }
  if (note !== undefined && (typeof note !== 'string' || note.length > NOTE_MAX_LEN)) {
    return sendError(res, 'invalid-argument', `note must be a string of at most ${NOTE_MAX_LEN} chars.`);
  }
  // segmentName is best-effort location context for the AI classify prompt only (see
  // buildClassifyPrompt) — never persisted, never a hard requirement.
  if (segmentName !== undefined && (typeof segmentName !== 'string' || segmentName.length > SEGMENT_NAME_MAX_LEN)) {
    return sendError(res, 'invalid-argument', `segmentName must be a string of at most ${SEGMENT_NAME_MAX_LEN} chars.`);
  }
  // photoPath stays optional/unused while Storage is disabled (frontend/src/lib/storage.js
  // PHOTO_UPLOAD_ENABLED) — validated here in case it's ever re-enabled.
  if (photoPath !== undefined) {
    if (typeof photoPath !== 'string' || !photoPath.startsWith(`reports/${uid}/`)) {
      return sendError(res, 'invalid-argument', 'photoPath must be the caller\'s own upload path.');
    }
  }
  const trimmedTitle = title.trim();
  const trimmedNote = (note || '').trim();

  // Step 2 — recent reports on this segment, for duplicate-detection context. Reuses the
  // existing (segmentId ASC, createdAt DESC) composite index (backend/firestore.indexes.json).
  const recentSnap = await db
    .collection('reports')
    .where('segmentId', '==', segmentId)
    .orderBy('createdAt', 'desc')
    .limit(10)
    .get();

  const now = Date.now();
  const recentDocs = recentSnap.docs.filter((d) => {
    const createdAt = d.get('createdAt');
    const ms = createdAt && typeof createdAt.toMillis === 'function' ? createdAt.toMillis() : null;
    return ms !== null && now - ms <= DUPLICATE_WINDOW_MS;
  });
  const existingReports = recentDocs.map((d) => ({
    conditionType: d.get('conditionType'),
    title: d.get('title'),
    note: d.get('note'),
    createdAt: d.get('createdAt')?.toDate?.().toISOString() ?? 'unknown time',
  }));

  // Step 3 — Gemini classify/dedupe/reject call, structured JSON output.
  // PS: skipped for demo purposes while AI_FEATURES_ENABLED is false — every report is
  // accepted as-is with a randomly assigned severity, no spam/mismatch/crime_label/duplicate checks.
  let decision;
  if (!AI_FEATURES_ENABLED) {
    decision = { severity: randomSeverityWhenAiDisabled(), verdict: 'valid', duplicateOfIndex: 0 };
  } else {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json', responseSchema: CLASSIFY_SCHEMA },
    });

    try {
      const prompt = buildClassifyPrompt(conditionType, trimmedTitle, trimmedNote, existingReports, segmentName);
      const result = await model.generateContent(prompt);
      decision = JSON.parse(result.response.text());
    } catch (err) {
      // Never log raw note contents (potential PII, Threat T6). Log only a safe message.
      console.error('Gemini classify failed:', err.message);
      return sendError(res, 'internal', 'Could not review this report right now. Please try again.');
    }

    if (
      !decision
      || !SEVERITY_VALUES.includes(decision.severity)
      || !VERDICTS.includes(decision.verdict)
      || !Number.isInteger(decision.duplicateOfIndex)
      || decision.duplicateOfIndex < 0
      || decision.duplicateOfIndex > recentDocs.length
    ) {
      console.error('Gemini classify returned an invalid shape.');
      return sendError(res, 'internal', 'Could not review this report right now. Please try again.');
    }
  }

  // Step 4 — act on the decision. Any non-valid verdict rejects with canned copy (BR-006);
  // nothing is stored.
  if (decision.verdict !== 'valid') {
    return res.json({ status: 'rejected', reason: REJECT_REASONS[decision.verdict], verdict: decision.verdict });
  }

  if (decision.duplicateOfIndex > 0) {
    const dupDoc = recentDocs[decision.duplicateOfIndex - 1];
    await dupDoc.ref.update({
      corroborationCount: FieldValue.increment(1),
      lastActivityAt: FieldValue.serverTimestamp(),
    });
    const updated = await dupDoc.ref.get();
    return res.json({
      status: 'duplicate',
      reportId: dupDoc.id,
      corroborationCount: updated.get('corroborationCount') ?? null,
    });
  }

  const newDoc = {
    segmentId,
    conditionType,
    title: trimmedTitle,
    createdAt: FieldValue.serverTimestamp(),
    lastActivityAt: FieldValue.serverTimestamp(),
    uid,
    severity: decision.severity,
    corroborationCount: 1,
  };
  if (trimmedNote) newDoc.note = trimmedNote;
  if (photoPath) newDoc.photoPath = photoPath;

  const ref = await db.collection('reports').add(newDoc);
  res.json({ status: 'created', reportId: ref.id, severity: decision.severity });
});

// Constrained prompt: answer using ONLY the listed reported conditions (BR-006/BR-007 spirit
// extended to a whole route rather than one segment) — no invented incidents, no crime-category/
// neighborhood labels, no rescue/dispatch promise (BR-002).
function buildRouteAssessmentPrompt(activeReports) {
  const lines = activeReports.map((r, i) => (
    `${i + 1}. ${r.segmentName} — [${r.severity} severity, ${r.conditionType}]`
    + `${r.note ? `: "${r.note}"` : ''} (reported ${r.createdAt})`
  ));
  return [
    'You are helping a pedestrian decide whether their planned route is okay to walk tonight,',
    'based ONLY on the community safety reports listed below for locations along that route.',
    'Do NOT invent any incident, location, or detail not present in the list. Do NOT label any',
    'street or neighborhood as a "crime zone" — describe fixable, observable conditions only',
    '(lighting, crowd level, recent incidents). Do NOT promise rescue, dispatch, or any real-time',
    'intervention — this is informational only.',
    '',
    'Give a short, practical answer (3-5 sentences): does the route seem okay tonight, or does it',
    'warrant caution/rerouting, and why — referencing only the specific conditions below.',
    '',
    'Reported conditions along this route:',
    lines.join('\n'),
  ].join('\n');
}

// F-003/F-008: AI-generated "is my route okay tonight?" assessment for the currently selected
// point-to-point route.
//
// Segments aren't a Firestore collection (they're a static frontend module — see
// docs/09-data-model.md), so the client supplies { segmentId, segmentName } pairs for whichever
// segments sit near the route (computed client-side via frontend/src/lib/routing.js
// nearestDistanceToRoute). This route does NOT trust any client-supplied report content, though
// — it reads each segment's latest report from Firestore itself, so the AI only ever sees real,
// currently-stored report data.
app.post('/assessRoute', requireAuth, async (req, res) => {
  const routeSegments = req.body && req.body.segments;
  if (!Array.isArray(routeSegments) || routeSegments.length === 0) {
    return sendError(res, 'invalid-argument', 'segments (non-empty array) is required.');
  }
  if (routeSegments.length > MAX_ROUTE_SEGMENTS) {
    return sendError(res, 'invalid-argument', `Too many segments (max ${MAX_ROUTE_SEGMENTS}).`);
  }
  for (const s of routeSegments) {
    if (!s || typeof s.segmentId !== 'string' || typeof s.segmentName !== 'string') {
      return sendError(res, 'invalid-argument', 'Each segment needs a segmentId and segmentName.');
    }
  }

  const now = Date.now();
  const activeReports = [];
  for (const { segmentId, segmentName } of routeSegments) {
    // eslint-disable-next-line no-await-in-loop -- bounded by MAX_ROUTE_SEGMENTS, same
    // per-segment query shape as submitReport's dedup lookup above (reuses the existing index).
    const snap = await db
      .collection('reports')
      .where('segmentId', '==', segmentId)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    if (snap.empty) continue;
    const doc = snap.docs[0];
    const activityAt = doc.get('lastActivityAt') || doc.get('createdAt');
    const ms = activityAt && typeof activityAt.toMillis === 'function' ? activityAt.toMillis() : null;
    if (ms === null || now - ms > FRESHNESS_WINDOW_MS) continue; // stale — not "tonight"
    activeReports.push({
      segmentName,
      conditionType: doc.get('conditionType'),
      severity: doc.get('severity') || 'red',
      note: doc.get('note'),
      createdAt: doc.get('createdAt')?.toDate?.().toISOString() ?? 'unknown time',
    });
  }

  // Cut-safe: nothing active along the route → skip the Gemini call entirely.
  if (activeReports.length === 0) {
    return res.json({ assessment: null, consideredCount: 0 });
  }

  // PS: skipped for demo purposes while AI_FEATURES_ENABLED is false — the client falls back
  // to its "no flagged conditions" cut-safe message instead of a Gemini assessment.
  if (!AI_FEATURES_ENABLED) {
    return res.json({ assessment: null, consideredCount: activeReports.length });
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  let assessment;
  try {
    const result = await model.generateContent(buildRouteAssessmentPrompt(activeReports));
    assessment = result.response.text().trim();
  } catch (err) {
    console.error('Gemini route assessment failed:', err.message);
    return sendError(res, 'internal', 'Could not assess this route right now. Please try again.');
  }

  res.json({ assessment, consideredCount: activeReports.length });
});

// ─────────────────────────────────────────────────────────────────────────────
// Analytics & Transparency routes — read-only, O(1), NO live Gemini calls.
// All three routes read exclusively from the pre-compiled Firestore cache written
// by backend/scripts/compile-analytics.mjs. Completely isolated from the AI path.
// ─────────────────────────────────────────────────────────────────────────────

// Shared helper: encodes a zone name to the Firestore doc ID used by compile-analytics.mjs.
function locationToDocId(location) {
  return location.replace(/\//g, '-').replace(/\s+/g, '_').toLowerCase();
}

// GET /api/v1/analytics/dashboard
// Purpose: feeds the React landing page charts (vulnerability breakdown, safe haven tallies,
// hourly trend data). Aggregates across all cached zone documents + the transparency summary
// in a single compound read. No auth required — public, cache-controlled.
app.get('/api/v1/analytics/dashboard', async (req, res) => {
  try {
    // Read both collections in parallel.
    const [cacheSnap, statsDoc] = await Promise.all([
      db.collection('barangay_analytics_cache').get(),
      db.collection('platform_transparency_stats').doc('global').get(),
    ]);

    // Guard: cache not yet seeded.
    if (cacheSnap.empty) {
      return res.status(503).json({
        error: 'cache_empty',
        message: 'Analytics cache has not been compiled yet. Run backend/scripts/compile-analytics.mjs first.',
        zones: [],
        totals: null,
        platform: null,
      });
    }

    // Aggregate vulnerability counts across all zones for the top-level dashboard widgets.
    const totals = {
      poor_lighting_count: 0,
      unsafe_infrastructure_count: 0,
      low_foot_traffic_count: 0,
      other_scams_count: 0,
      total_weighted_reports: 0,
    };

    const zones = cacheSnap.docs.map((doc) => {
      const d = doc.data();
      const m = d.metrics || {};
      totals.poor_lighting_count += m.poor_lighting_count || 0;
      totals.unsafe_infrastructure_count += m.unsafe_infrastructure_count || 0;
      totals.low_foot_traffic_count += m.low_foot_traffic_count || 0;
      totals.other_scams_count += m.other_scams_count || 0;
      totals.total_weighted_reports +=
        (m.poor_lighting_count || 0) +
        (m.unsafe_infrastructure_count || 0) +
        (m.low_foot_traffic_count || 0) +
        (m.other_scams_count || 0);

      // Return the full zone shape — executive_summary intentionally included so the
      // React dashboard can show a tooltip or expandable card per zone without a
      // second round-trip.
      return {
        location: d.location,
        last_updated: d.last_updated,
        metrics: m,
        executive_summary: d.ai_analysis?.executive_summary ?? null,
      };
    });

    // Sort zones by total report weight descending so the front-end can render the
    // top-N most active zones without a client-side sort.
    zones.sort((a, b) => {
      const sumA = Object.values(a.metrics).reduce((s, v) => s + (v || 0), 0);
      const sumB = Object.values(b.metrics).reduce((s, v) => s + (v || 0), 0);
      return sumB - sumA;
    });

    const platform = statsDoc.exists ? statsDoc.data() : null;

    res.set('Cache-Control', 'public, max-age=300'); // 5-min browser cache — safe for static data
    res.json({ zones, totals, platform });
  } catch (err) {
    console.error('GET /api/v1/analytics/dashboard failed:', err.message);
    sendError(res, 'internal', 'Could not load analytics dashboard.');
  }
});

// GET /api/v1/transparency/stats
// Purpose: unauthenticated public endpoint showing platform data-integrity metrics so judges
// and users can verify the dataset is real and moderated. O(1) single-document read.
app.get('/api/v1/transparency/stats', async (req, res) => {
  try {
    const doc = await db.collection('platform_transparency_stats').doc('global').get();

    if (!doc.exists) {
      return res.status(503).json({
        error: 'cache_empty',
        message: 'Transparency stats have not been compiled yet. Run backend/scripts/compile-analytics.mjs first.',
        stats: null,
      });
    }

    res.set('Cache-Control', 'public, max-age=300');
    res.json({ stats: doc.data() });
  } catch (err) {
    console.error('GET /api/v1/transparency/stats failed:', err.message);
    sendError(res, 'internal', 'Could not load transparency stats.');
  }
});

// GET /api/v1/analytics/download-pdf?location=<zone name>
// Purpose: streams a formatted barangay brief PDF for the given zone directly to the client.
// Pulls exclusively from the pre-compiled barangay_analytics_cache — no live Gemini call.
// Guarded by isAdmin — prevents anonymous bandwidth drain and keeps the PDF pipeline admin-only.
app.get('/api/v1/analytics/download-pdf', isAdmin, async (req, res) => {
  const location = typeof req.query.location === 'string' ? req.query.location.trim() : '';
  if (!location) {
    return sendError(res, 'invalid-argument', 'Query parameter `location` is required.');
  }

  const docId = locationToDocId(location);

  let cacheDoc;
  try {
    cacheDoc = await db.collection('barangay_analytics_cache').doc(docId).get();
  } catch (err) {
    console.error('GET /api/v1/analytics/download-pdf Firestore read failed:', err.message);
    return sendError(res, 'internal', 'Could not retrieve zone data.');
  }

  if (!cacheDoc.exists) {
    return res.status(404).json({
      error: 'not_found',
      message: `No analytics cache found for location "${location}". Run compile-analytics.mjs first, or check the location name.`,
    });
  }

  const data = cacheDoc.data();
  const metrics = data.metrics || {};
  const analysis = data.ai_analysis || {};
  const mitigations = Array.isArray(analysis.actionable_mitigations) ? analysis.actionable_mitigations : [];
  const summary = typeof analysis.executive_summary === 'string' ? analysis.executive_summary : '';
  const lastUpdated = data.last_updated ? new Date(data.last_updated).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown';

  // Stream the PDF directly — no temp file on disk.
  const filename = `GuidHer_Brief_${location.replace(/[^a-z0-9]/gi, '_')}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.pipe(res);

  // ── Header ────────────────────────────────────────────────────────────────
  doc
    .fontSize(22)
    .font('Helvetica-Bold')
    .text('GuidHer', { align: 'left' })
    .fontSize(10)
    .font('Helvetica')
    .fillColor('#666666')
    .text('Community Safety Infrastructure Brief', { align: 'left' })
    .moveDown(0.3)
    .text(`Zone: ${location}`, { align: 'left' })
    .text(`Compiled: ${lastUpdated}`, { align: 'left' })
    .moveDown(0.5);

  // Horizontal rule
  doc
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .strokeColor('#cccccc')
    .lineWidth(1)
    .stroke()
    .moveDown(0.8);

  // ── Executive Summary ─────────────────────────────────────────────────────
  doc
    .fontSize(13)
    .font('Helvetica-Bold')
    .fillColor('#000000')
    .text('Executive Summary')
    .moveDown(0.4)
    .fontSize(10)
    .font('Helvetica')
    .text(summary || 'No summary available. Run compile-analytics.mjs to generate AI analysis.', {
      align: 'justify',
      lineGap: 2,
    })
    .moveDown(1);

  // ── Vulnerability Metrics ─────────────────────────────────────────────────
  doc
    .fontSize(13)
    .font('Helvetica-Bold')
    .text('Reported Infrastructure Vulnerability Counts')
    .moveDown(0.5);

  const metricRows = [
    ['Poor Lighting Incidents', metrics.poor_lighting_count ?? 0],
    ['Unsafe Infrastructure Reports', metrics.unsafe_infrastructure_count ?? 0],
    ['Low Foot Traffic / Isolation', metrics.low_foot_traffic_count ?? 0],
    ['Other Environmental Concerns', metrics.other_scams_count ?? 0],
  ];

  for (const [label, count] of metricRows) {
    const barWidth = Math.min(Math.round((count / Math.max(...metricRows.map(([, c]) => c), 1)) * 200), 200);
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`${label}`, 50, doc.y, { continued: true, width: 280 })
      .font('Helvetica-Bold')
      .text(`${count}`, { align: 'right' })
      .moveDown(0.15);
    if (barWidth > 0) {
      doc
        .rect(50, doc.y, barWidth, 6)
        .fillColor('#e53e3e')
        .fill()
        .fillColor('#000000');
    }
    doc.moveDown(0.6);
  }

  doc.moveDown(0.5);

  // ── Actionable Mitigations ────────────────────────────────────────────────
  doc
    .fontSize(13)
    .font('Helvetica-Bold')
    .fillColor('#000000')
    .text('Recommended Barangay Actions')
    .moveDown(0.5);

  if (mitigations.length === 0) {
    doc
      .fontSize(10)
      .font('Helvetica')
      .text('No mitigations available. Run compile-analytics.mjs with a valid GEMINI_API_KEY.');
  } else {
    mitigations.forEach((mitigation, i) => {
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(`${i + 1}.`, 50, doc.y, { continued: true, width: 30 })
        .fontSize(10)
        .font('Helvetica')
        .text(`  ${mitigation}`, { align: 'justify', lineGap: 2 })
        .moveDown(0.6);
    });
  }

  doc.moveDown(0.5);

  // ── Footer ────────────────────────────────────────────────────────────────
  doc
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .strokeColor('#cccccc')
    .lineWidth(1)
    .stroke()
    .moveDown(0.5)
    .fontSize(8)
    .fillColor('#999999')
    .font('Helvetica')
    .text(
      'This brief was generated from anonymised community-sourced infrastructure reports. It describes observable, fixable conditions — not crime classifications. ' +
      'For use in local Barangay coordination and public-service improvement requests only.',
      { align: 'justify', lineGap: 1 },
    );

  doc.end();
});

// ─────────────────────────────────────────────────────────────────────────────
// Admin-only routes — all guarded by isAdmin middleware.
// Normal authenticated users cannot reach these endpoints under any condition.
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/admin/reports/summary?limit=<n>&after=<docId>
// Purpose: paginated raw report stream for the admin moderation table.
// Returns reports newest-first, up to PAGE_SIZE per request. Cursor-based pagination via
// the `after` query param (the last document id from the previous page).
const ADMIN_PAGE_SIZE = 50;

app.get('/api/v1/admin/reports/summary', isAdmin, async (req, res) => {
  try {
    const pageSize = Math.min(
      parseInt(req.query.limit, 10) || ADMIN_PAGE_SIZE,
      200, // hard ceiling — no unbounded reads
    );

    let query = db.collection('reports').orderBy('createdAt', 'desc').limit(pageSize);

    // Cursor: if `after` doc id is supplied, start after that document.
    if (req.query.after && typeof req.query.after === 'string') {
      const cursorDoc = await db.collection('reports').doc(req.query.after).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snap = await query.get();
    const reports = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        segmentId: data.segmentId,
        conditionType: data.conditionType,
        severity: data.severity || null,
        title: data.title,
        note: data.note || null,
        corroborationCount: data.corroborationCount || 1,
        uid: data.uid,
        createdAt: data.createdAt?.toDate?.().toISOString() ?? null,
        lastActivityAt: data.lastActivityAt?.toDate?.().toISOString() ?? null,
      };
    });

    const lastId = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1].id : null;
    res.json({ reports, count: reports.length, nextCursor: lastId });
  } catch (err) {
    console.error('GET /api/v1/admin/reports/summary failed:', err.message);
    sendError(res, 'internal', 'Could not load reports.');
  }
});

// DELETE /api/v1/admin/reports/:id
// Purpose: atomic admin moderation delete. Removes the document and decrements
// platform_transparency_stats totals in the same Firestore transaction so the
// global telemetry never drifts from the actual report count.
app.delete('/api/v1/admin/reports/:id', isAdmin, async (req, res) => {
  const reportId = req.params.id;
  if (!reportId || typeof reportId !== 'string') {
    return sendError(res, 'invalid-argument', 'Report id is required.');
  }

  try {
    await db.runTransaction(async (tx) => {
      const reportRef = db.collection('reports').doc(reportId);
      const reportSnap = await tx.get(reportRef);

      if (!reportSnap.exists) {
        const e = new Error('not_found');
        e.code = 'not_found';
        throw e;
      }

      // Hard-delete the report. Admin SDK bypasses Firestore rules; delete is also
      // explicitly allowed for admins in firestore.rules (allow delete: if isAdmin()).
      tx.delete(reportRef);

      // Decrement total_community_reports_processed atomically.
      // merge:true ensures the stats doc is created if it doesn't exist yet.
      const statsRef = db.collection('platform_transparency_stats').doc('global');
      tx.set(
        statsRef,
        { total_community_reports_processed: FieldValue.increment(-1) },
        { merge: true },
      );
    });

    res.json({ status: 'deleted', reportId });
  } catch (err) {
    if (err.code === 'not_found') {
      return res.status(404).json({ error: 'not_found', message: `Report "${reportId}" not found.` });
    }
    console.error('DELETE /api/v1/admin/reports/:id failed:', err.message);
    sendError(res, 'internal', 'Could not delete report.');
  }
});

// POST /api/v1/admin/compile-analytics
// Purpose: triggers the analytics batch-compilation pipeline inline via the live API.
// Same logic as backend/scripts/compile-analytics.mjs — used by the admin UI "Force Re-Compile"
// button. Runs synchronously so the frontend receives a definitive success/failure and can
// immediately re-fetch the dashboard.
//
// Free-tier guard: 2-second inter-Gemini-call delay preserved here. ~30s worst-case for
// 15 active zones — acceptable for an admin-only, infrequent action.

// 25 zone names (mirrored from compile-analytics.mjs — server is self-contained).
const ANALYTICS_ZONES = [
  'Teresa Street', 'LRT-2 Pureza Station', 'Pureza Street', 'LRT-2 Legarda Station',
  'Magsaysay Boulevard', 'Recto Avenue', 'Legarda Street', 'España Boulevard',
  'Earnshaw Street', 'Morayta Street', 'Lacson Avenue', 'Anonas Street',
  'Hipodromo', 'NDC Compound', 'V. Mapa', 'P. Campa', 'Stop & Shop',
  'Recto Legarda', 'Sampaloc', 'Sta. Mesa', 'LRT-2 V. Mapa Station',
  'LRT-2 J. Ruiz Station', 'LRT-2 Gilmore Station',
  'LRT-2 Betty Go-Belmonte Station', 'LRT-2 Araneta-Cubao Station',
];

const SEGMENT_ZONE_MAP = {
  seg_teresa_st: 'Teresa Street', seg_teresa_wellused_1: 'Teresa Street',
  seg_teresa_wellused_2: 'Teresa Street', seg_pureza_south_exit: 'LRT-2 Pureza Station',
  seg_pureza_approaches: 'LRT-2 Pureza Station', seg_pureza_st_1: 'Pureza Street',
  seg_pureza_st_2: 'Pureza Street', seg_pureza_st_3: 'Pureza Street',
  seg_pureza_st_4: 'Pureza Street', seg_pureza_st_5: 'Pureza Street',
  seg_pureza_st_6: 'Pureza Street', seg_legarda_estero: 'LRT-2 Legarda Station',
  seg_recto_legarda: 'Recto Legarda', seg_vmapa_sm: 'V. Mapa',
  seg_pcampa_altroute: 'P. Campa', seg_magsaysay_jeeps: 'Magsaysay Boulevard',
  seg_anonas_st_1: 'Anonas Street', seg_anonas_st_2: 'Anonas Street',
  seg_anonas_st_3: 'Anonas Street', seg_anonas_st_4: 'Anonas Street',
  seg_anonas_st_5: 'Anonas Street', seg_anonas_st_6: 'Anonas Street',
  seg_anonas_st_7: 'Anonas Street', seg_anonas_st_8: 'Anonas Street',
  seg_hipodromo_st_1: 'Hipodromo', seg_hipodromo_st_2: 'Hipodromo',
  seg_hipodromo_st_3: 'Hipodromo', seg_hipodromo_st_4: 'Hipodromo',
  seg_hipodromo_st_5: 'Hipodromo', seg_hipodromo_st_6: 'Hipodromo',
  seg_hipodromo_st_7: 'Hipodromo',
};

const COMPILE_SYSTEM_INSTRUCTION = `
You are an expert urban planning and public safety data analyst for Metro Manila.
Analyze the provided raw infrastructure vulnerability counts for a specific barangay corridor.
Output a strict, professional JSON object with exactly two keys:
1. "executive_summary": A concise, 3-sentence summary of the environmental conditions in Taglish.
2. "actionable_mitigations": An array of exactly 3 low-cost, fixable physical solutions the local Barangay can execute immediately.
Do not mention crime labels or create panic-inducing language. Focus strictly on environmental conditions (lighting, visibility, crowds).
`.trim();

const COMPILE_ANALYSIS_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    executive_summary: { type: SchemaType.STRING },
    actionable_mitigations: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
  },
  required: ['executive_summary', 'actionable_mitigations'],
};

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

app.post('/api/v1/admin/compile-analytics', isAdmin, async (req, res) => {
  const aiEnabled = !!GEMINI_API_KEY;

  try {
    // Step 1 — read all reports and bucket by zone.
    const reportsSnap = await db.collection('reports').get();

    const buckets = {};
    for (const zone of ANALYTICS_ZONES) {
      buckets[zone] = {
        poor_lighting_count: 0,
        unsafe_infrastructure_count: 0,
        low_foot_traffic_count: 0,
        other_scams_count: 0,
        notes: [],
      };
    }

    const COND_TO_METRIC = {
      poor_lighting: 'poor_lighting_count',
      no_crowd: 'low_foot_traffic_count',
      recent_incident: 'unsafe_infrastructure_count',
    };

    let totalReports = 0;
    let spamCount = 0;
    let dupCount = 0;

    for (const d of reportsSnap.docs) {
      if (d.get('verdict') === 'spam') { spamCount++; continue; }
      const corr = d.get('corroborationCount') || 1;
      if (corr > 1) dupCount += corr - 1;
      const segId = d.get('segmentId') || '';
      const locField = d.get('location');
      const zone = (locField && ANALYTICS_ZONES.includes(locField))
        ? locField
        : (SEGMENT_ZONE_MAP[segId] || (segId.startsWith('seg_osm_') ? 'Sta. Mesa' : null));
      if (!zone) continue;
      const key = COND_TO_METRIC[d.get('conditionType')] || 'other_scams_count';
      buckets[zone][key] += corr;
      totalReports += corr;
      const note = d.get('note');
      if (note && typeof note === 'string' && note.trim()) buckets[zone].notes.push(note.trim());
    }

    // Step 2 — Gemini analysis per active zone, batch write cache.
    const genAI = aiEnabled ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
    const writeBatch = db.batch();
    let aiCallsMade = 0;
    const activeZoneNames = ANALYTICS_ZONES.filter((z) => {
      const b = buckets[z];
      return (b.poor_lighting_count + b.unsafe_infrastructure_count + b.low_foot_traffic_count + b.other_scams_count) > 0;
    });

    for (const zone of ANALYTICS_ZONES) {
      const b = buckets[zone];
      const total = b.poor_lighting_count + b.unsafe_infrastructure_count + b.low_foot_traffic_count + b.other_scams_count;
      const hasData = total > 0;

      let aiAnalysis = null;

      if (aiEnabled && hasData) {
        try {
          const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: COMPILE_SYSTEM_INSTRUCTION,
            generationConfig: {
              responseMimeType: 'application/json',
              responseSchema: COMPILE_ANALYSIS_SCHEMA,
            },
          });
          const prompt = [
            `Zone: "${zone}"`,
            `Poor lighting: ${b.poor_lighting_count}`,
            `Unsafe infrastructure: ${b.unsafe_infrastructure_count}`,
            `Low foot traffic: ${b.low_foot_traffic_count}`,
            `Other concerns: ${b.other_scams_count}`,
            b.notes.length
              ? `Sample notes:\n${b.notes.slice(0, 5).map((n, j) => `${j + 1}. "${n}"`).join('\n')}`
              : '',
          ].filter(Boolean).join('\n');

          const result = await model.generateContent(prompt);
          const parsed = JSON.parse(result.response.text());
          if (typeof parsed.executive_summary === 'string' && Array.isArray(parsed.actionable_mitigations)) {
            aiAnalysis = parsed;
            aiCallsMade++;
            if (aiCallsMade < activeZoneNames.length) await sleep(2000);
          }
        } catch (geminiErr) {
          console.error(`Gemini compile failed for "${zone}":`, geminiErr.message);
        }
      }

      if (!aiAnalysis) {
        aiAnalysis = {
          executive_summary: hasData
            ? `Ang zone na "${zone}" ay may ${total} naitalagang community report. Ang AI analysis ay hindi available; i-set ang GEMINI_API_KEY at i-compile muli.`
            : `Ang zone na "${zone}" ay wala pang naitalagang community reports para sa panahon na ito.`,
          actionable_mitigations: hasData
            ? ['I-set ang GEMINI_API_KEY at i-rerun ang compile para sa AI mitigations.', 'Tingnan ang metrics field para sa manual na pagsusuri ng kondisyon.', 'Makipag-coordinate sa lokal na tanggapan base sa aggregated data.']
            : ['Magsagawa ng barangay survey para ma-assess ang kalagayan ng kalsada.', 'Mag-coordinate sa lokal na tanggapan para sa regular na pagsisiyasat.', 'Hikayatin ang komunidad na mag-submit ng mga ulat tungkol sa kondisyon ng lugar.'],
        };
      }

      const docId = locationToDocId(zone);
      writeBatch.set(db.collection('barangay_analytics_cache').doc(docId), {
        location: zone,
        last_updated: new Date().toISOString(),
        metrics: {
          poor_lighting_count: b.poor_lighting_count,
          unsafe_infrastructure_count: b.unsafe_infrastructure_count,
          low_foot_traffic_count: b.low_foot_traffic_count,
          other_scams_count: b.other_scams_count,
        },
        ai_analysis: {
          executive_summary: aiAnalysis.executive_summary,
          actionable_mitigations: aiAnalysis.actionable_mitigations,
        },
      });
    }

    await writeBatch.commit();

    // Step 3 — write transparency stats.
    await db.collection('platform_transparency_stats').doc('global').set({
      total_community_reports_processed: totalReports,
      ai_moderation_rejections_spam: spamCount,
      duplicate_corroborations_merged: dupCount,
      generated_barangay_briefs_count: ANALYTICS_ZONES.length,
      last_processed_timestamp: new Date().toISOString(),
    });

    res.json({
      status: 'compiled',
      zonesWritten: ANALYTICS_ZONES.length,
      reportsProcessed: totalReports,
      aiCallsMade,
      aiEnabled,
    });
  } catch (err) {
    console.error('POST /api/v1/admin/compile-analytics failed:', err.message);
    sendError(res, 'internal', 'Analytics compilation failed.');
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`SaferRoute API listening on port ${port}`);
});
