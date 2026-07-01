// Firestore read access for reports — shared by F-001/002/003/004.
// Traces to: docs/09-data-model.md (reports collection), docs/03-prd.md (BR-001/004/005/006).
//
// Report WRITES no longer happen here (or anywhere client-side) — see
// frontend/src/lib/reportIntake.js. backend/firestore.rules denies direct client
// create/update/delete on `reports`; every report is written by the submitReport Cloud
// Function (backend/functions/index.js) after AI review, via the Admin SDK.
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from './firebase.js';

const reportsCol = collection(db, 'reports');

// Subscribe to all reports (single zone, small set), newest first. Returns an unsubscribe fn.
// onChange receives an array of { id, segmentId, conditionType, createdAt, uid, note? }.
export function subscribeReports(onChange) {
  const q = query(reportsCol, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// Reduce a reports array to the newest report per segmentId.
// Input is assumed newest-first (as subscribeReports delivers).
export function latestBySegment(reports) {
  const map = new Map();
  for (const r of reports) {
    if (!map.has(r.segmentId)) map.set(r.segmentId, r);
  }
  return map;
}
