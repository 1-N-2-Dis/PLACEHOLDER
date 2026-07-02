// Gemini proxy Cloud Function (F-004, P1 STRETCH).
// Role: server-side proxy that holds the Gemini key and turns a segment's report notes into a
// deduplicated, structured summary.
// Traces to: docs/06-system-design.md, docs/12-security-compliance.md.
//
// WHY SERVER-SIDE: the Gemini key must never ship in the client bundle (Threat T2). The
// authenticated client invokes this callable; the function alone holds the key.
//
// CUT-SAFE: if F-004 is dropped, this function simply isn't deployed and the client falls back
// to the raw flag list (UJ-003 degraded path).
//
// PS: all Gemini-backed features (submitReport moderation, summarizeSegment, assessRoute) are
// currently disabled for demo purposes, so the app responds instantly instead of waiting on the
// model. See AI_FEATURES_ENABLED below.
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

initializeApp();
const db = getFirestore();

// Held server-side only. Set with: firebase functions:secrets:set GEMINI_API_KEY
const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

// Mirrors frontend/src/data/condition-types.js — the closed enum (BR-001). Duplicated here
// because backend/functions is a separate Node package from frontend; this array (not Rules,
// see submitReport below) is now the server-side enforcement point for the enum.
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
// summarizeSegment, assessRoute) and fall straight through to each function's existing cut-safe
// fallback path instead. Flip back to true to restore all AI features.
const AI_FEATURES_ENABLED = false;
const DEFAULT_SEVERITY_WHEN_AI_DISABLED = 'yellow';

// How close in time a new report must be to an existing one on the same segment to be eligible
// for AI duplicate-merge. Tighter than the 24h "tonight" freshness window (frontend/src/lib/
// freshness.js) because a duplicate is a near-concurrent corroboration, not just a fresh report.
const DUPLICATE_WINDOW_MS = 6 * 60 * 60 * 1000;

// Mirrors frontend/src/lib/freshness.js's FRESHNESS_WINDOW_MS (24h) — a report counts as "active
// tonight" within this window. Duplicated here for the same reason CONDITION_TYPES is duplicated:
// backend/functions is a separate Node package from frontend.
const FRESHNESS_WINDOW_MS = 24 * 60 * 60 * 1000;
// Bounds the number of Firestore reads (one per on-route segment) and prompt size per assessRoute
// call — a route realistically passes near a couple dozen mapped points at most.
const MAX_ROUTE_SEGMENTS = 30;

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

export const summarizeSegment = onCall(
  { region: 'asia-southeast1', secrets: [GEMINI_API_KEY] },
  async (request) => {
    // Auth gate: only signed-in clients (BR-005 spirit; the client is anonymously authed).
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Sign-in required.');
    }
    const segmentId = request.data && request.data.segmentId;
    if (!segmentId || typeof segmentId !== 'string') {
      throw new HttpsError('invalid-argument', 'segmentId is required.');
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
      return { summary: null, count: 0 };
    }

    // PS: skipped for demo purposes while AI_FEATURES_ENABLED is false — the client falls back
    // to its raw flag list instead of a Gemini summary.
    if (!AI_FEATURES_ENABLED) {
      return { summary: null, count: notes.length };
    }

    const segmentName = snap.docs[0].get('segmentId'); // name lives on segments; id is enough context here.
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.value());
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    let summary;
    try {
      const result = await model.generateContent(buildPrompt(segmentName, notes));
      summary = result.response.text().trim();
    } catch (err) {
      // Never log raw note contents (potential PII, Threat T6). Log only a safe message.
      console.error('Gemini summarize failed:', err.message);
      throw new HttpsError('internal', 'Summary unavailable.');
    }

    return { summary, count: notes.length };
  },
);

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

// Constrained prompt: classify severity from observable/fixable-condition language ONLY (BR-001
// spirit extended to this new field — severity is a per-report triage signal, never a place or
// crime classification), decide if this looks like a duplicate of one of the listed recent
// reports on the same segment, and pick a validity verdict (valid/spam/mismatch/crime_label —
// see VERDICTS). Never invents an incident beyond what's in the new submission (BR-006 spirit).
//
// segmentName (optional) is the reporter's own client-known display name for the location (see
// docs/superpowers/specs/2026-07-01-report-wizard-frontend-design.md) — passed through so the
// spam verdict can also weigh whether the condition is a plausible claim for that named street,
// not just whether the text alone reads as spam. Omitted entirely from the prompt if absent;
// this never blocks submission.
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
// backend/firestore.rules denies client create/update/delete on that collection, so this
// callable (via the Admin SDK, which bypasses Rules) is the ONLY path that can write a report.
// This function's validation is therefore the enforcement point for BR-001's closed enum/field
// shape that Firestore Rules used to check for direct writes.
//
// FAIL-CLOSED: unlike summarizeSegment (which degrades to a raw-list fallback on Gemini
// failure), a missing moderation decision here must never become an unmoderated write — any
// Gemini error or malformed response rejects the report rather than accepting it.
export const submitReport = onCall(
  { region: 'asia-southeast1', secrets: [GEMINI_API_KEY] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Sign-in required.');
    }
    const uid = request.auth.uid;
    const data = request.data || {};
    const { segmentId, segmentName, conditionType, title, note, photoPath } = data;

    // Step 1 — structural validation (BR-001/BR-004, the direct replacement for what
    // firestore.rules used to enforce on a client create).
    if (typeof segmentId !== 'string' || !segmentId) {
      throw new HttpsError('invalid-argument', 'segmentId is required.');
    }
    if (!CONDITION_TYPES.includes(conditionType)) {
      throw new HttpsError('invalid-argument', 'conditionType must be one of the closed enum.');
    }
    if (typeof title !== 'string' || !title.trim() || title.length > TITLE_MAX_LEN) {
      throw new HttpsError('invalid-argument', `title is required (max ${TITLE_MAX_LEN} chars).`);
    }
    if (note !== undefined && (typeof note !== 'string' || note.length > NOTE_MAX_LEN)) {
      throw new HttpsError('invalid-argument', `note must be a string of at most ${NOTE_MAX_LEN} chars.`);
    }
    // segmentName is best-effort location context for the AI classify prompt only (see
    // buildClassifyPrompt) — never persisted, never a hard requirement.
    if (segmentName !== undefined && (typeof segmentName !== 'string' || segmentName.length > SEGMENT_NAME_MAX_LEN)) {
      throw new HttpsError('invalid-argument', `segmentName must be a string of at most ${SEGMENT_NAME_MAX_LEN} chars.`);
    }
    if (photoPath !== undefined) {
      if (typeof photoPath !== 'string' || !photoPath.startsWith(`reports/${uid}/`)) {
        throw new HttpsError('invalid-argument', 'photoPath must be the caller\'s own upload path.');
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
    // accepted as-is with a default severity, no spam/mismatch/crime_label/duplicate checks.
    let decision;
    if (!AI_FEATURES_ENABLED) {
      decision = { severity: DEFAULT_SEVERITY_WHEN_AI_DISABLED, verdict: 'valid', duplicateOfIndex: 0 };
    } else {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.value());
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
        throw new HttpsError('internal', 'Could not review this report right now. Please try again.');
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
        throw new HttpsError('internal', 'Could not review this report right now. Please try again.');
      }
    }

    // Step 4 — act on the decision. Any non-valid verdict rejects with canned copy (BR-006);
    // nothing is stored.
    if (decision.verdict !== 'valid') {
      return { status: 'rejected', reason: REJECT_REASONS[decision.verdict], verdict: decision.verdict };
    }

    if (decision.duplicateOfIndex > 0) {
      const dupDoc = recentDocs[decision.duplicateOfIndex - 1];
      await dupDoc.ref.update({
        corroborationCount: FieldValue.increment(1),
        lastActivityAt: FieldValue.serverTimestamp(),
      });
      const updated = await dupDoc.ref.get();
      return {
        status: 'duplicate',
        reportId: dupDoc.id,
        corroborationCount: updated.get('corroborationCount') ?? null,
      };
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
    return { status: 'created', reportId: ref.id, severity: decision.severity };
  },
);

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

// F-003/F-008 (revised): AI-generated "is my route okay tonight?" assessment for the currently
// selected point-to-point route — replaces the earlier rule-based RouteSafetyPanel and the manual
// per-segment checklist, consolidated into one on-demand AI check (per request).
//
// Segments aren't a Firestore collection (they're a static frontend module — see
// docs/09-data-model.md), so the client supplies { segmentId, segmentName } pairs for whichever
// segments sit near the route (computed client-side via frontend/src/lib/routing.js
// nearestDistanceToRoute, same helper RouteSafetyPanel used). This function does NOT trust any
// client-supplied report content, though — it reads each segment's latest report from Firestore
// itself, so the AI only ever sees real, currently-stored report data.
export const assessRoute = onCall(
  { region: 'asia-southeast1', secrets: [GEMINI_API_KEY] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Sign-in required.');
    }
    const routeSegments = request.data && request.data.segments;
    if (!Array.isArray(routeSegments) || routeSegments.length === 0) {
      throw new HttpsError('invalid-argument', 'segments (non-empty array) is required.');
    }
    if (routeSegments.length > MAX_ROUTE_SEGMENTS) {
      throw new HttpsError('invalid-argument', `Too many segments (max ${MAX_ROUTE_SEGMENTS}).`);
    }
    for (const s of routeSegments) {
      if (!s || typeof s.segmentId !== 'string' || typeof s.segmentName !== 'string') {
        throw new HttpsError('invalid-argument', 'Each segment needs a segmentId and segmentName.');
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
      return { assessment: null, consideredCount: 0 };
    }

    // PS: skipped for demo purposes while AI_FEATURES_ENABLED is false — the client falls back
    // to its "no flagged conditions" cut-safe message instead of a Gemini assessment.
    if (!AI_FEATURES_ENABLED) {
      return { assessment: null, consideredCount: activeReports.length };
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.value());
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    let assessment;
    try {
      const result = await model.generateContent(buildRouteAssessmentPrompt(activeReports));
      assessment = result.response.text().trim();
    } catch (err) {
      console.error('Gemini route assessment failed:', err.message);
      throw new HttpsError('internal', 'Could not assess this route right now. Please try again.');
    }

    return { assessment, consideredCount: activeReports.length };
  },
);
