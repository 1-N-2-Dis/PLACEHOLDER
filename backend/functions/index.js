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
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';

initializeApp();
const db = getFirestore();

// Held server-side only. Set with: firebase functions:secrets:set GEMINI_API_KEY
const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

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

    const segmentName = snap.docs[0].get('segmentId'); // name lives on segments; id is enough context here.
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.value());
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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
