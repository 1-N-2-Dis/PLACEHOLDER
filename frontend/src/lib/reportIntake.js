// F-002/F-006: submit a one-tap report for AI review (severity classify / duplicate-merge /
// reject) instead of writing directly to Firestore.
// Traces to: docs/03-prd.md F-006, backend/functions/index.js submitReport.
//
// This is a blocking call by design (confirmed UX decision): the caller shows a spinner until
// this resolves, then renders one of the three outcomes below. No optimistic map update happens
// before the AI review completes.
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase.js';
import { ensureSignedIn } from './auth.js';
import { isValidConditionType } from '../data/condition-types.js';
import { stripExifAndResize } from './photo.js';
import { uploadReportPhoto } from './storage.js';

const submitReportCallable = httpsCallable(functions, 'submitReport');

// Returns one of:
//   { status: 'created', reportId, severity }
//   { status: 'duplicate', reportId, corroborationCount }
//   { status: 'rejected', reason, verdict }  (verdict: spam | mismatch | crime_label)
// Throws if the call itself fails (network/auth/server error) — distinct from a 'rejected'
// result, which is a successful call that the AI declined to file.
//
// photoFile, if given, is a raw File from an <input type="file">. It's EXIF-stripped and
// uploaded to Storage BEFORE the AI review call, so submitReport only ever sees a photoPath it
// can validate against the caller's own uid (see backend/functions/index.js).
//
// segmentName, if given, is the display name already known client-side (from the segment list
// the report wizard offers) — passed through so the AI classify prompt has location context for
// its real/fake judgment, without the backend needing its own Firestore lookup (see
// docs/superpowers/specs/2026-07-01-report-wizard-frontend-design.md).
export async function submitReportForReview({ segmentId, segmentName, conditionType, title, note, photoFile }) {
  if (!isValidConditionType(conditionType)) {
    throw new Error(`Invalid conditionType: ${conditionType}`);
  }
  const trimmedTitle = (title || '').trim();
  if (!trimmedTitle) {
    throw new Error('title is required.');
  }
  const user = await ensureSignedIn();
  const trimmedNote = (note || '').trim();
  const payload = { segmentId, conditionType, title: trimmedTitle };
  if (trimmedNote) payload.note = trimmedNote;
  if (segmentName) payload.segmentName = segmentName;

  if (photoFile) {
    const blob = await stripExifAndResize(photoFile);
    payload.photoPath = await uploadReportPhoto(user.uid, blob);
  }

  const result = await submitReportCallable(payload);
  return result.data;
}
