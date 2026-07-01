// Firestore data access for reports — shared by F-001/002/003/004.
// Traces to: docs/09-data-model.md (reports collection), docs/03-prd.md (BR-001/004/005/006).
import {
  collection, addDoc, query, orderBy, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase.js';
import { ensureSignedIn, currentUid } from './auth.js';
import { isValidConditionType } from '../data/condition-types.js';

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

// Write one report (F-002). Enforces auth (BR-005) and the closed enum (BR-001) client-side;
// Firestore rules enforce both again server-side. note is optional and feeds F-004 only (BR-006).
export async function addReport({ segmentId, conditionType, note }) {
  if (!isValidConditionType(conditionType)) {
    throw new Error(`Invalid conditionType: ${conditionType}`);
  }
  await ensureSignedIn();
  const doc = {
    segmentId,
    conditionType,
    createdAt: serverTimestamp(),
    uid: currentUid(),
  };
  const trimmed = (note || '').trim();
  if (trimmed) doc.note = trimmed;
  return addDoc(reportsCol, doc);
}
