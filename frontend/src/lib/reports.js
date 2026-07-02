// Firestore read access for reports — shared by F-001/002/003/004.
// Traces to: docs/09-data-model.md (reports collection), docs/03-prd.md (BR-001/004/005/006).
//
// Live Firestore subscription (mockReports.js was the prototype-era stand-in; it is no longer
// imported and can be removed once nothing references it).
//
// Report WRITES no longer happen here — see reportIntake.js. Firestore rules deny direct
// client writes; every report goes through the submitReport Cloud Function (F-006).
// The one client write path is delete, and only for admins (F-009 moderation).
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase.js';

const reportsCol = collection(db, 'reports');

export function subscribeReports(onChange) {
  const q = query(reportsCol, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export function latestBySegment(reports) {
  const map = new Map();
  for (const r of reports) {
    if (!map.has(r.segmentId)) map.set(r.segmentId, r);
  }
  return map;
}

// F-009 admin moderation: remove a report (remove-only; rules allow delete for admins only).
export function deleteReport(id) {
  return deleteDoc(doc(db, 'reports', id));
}
