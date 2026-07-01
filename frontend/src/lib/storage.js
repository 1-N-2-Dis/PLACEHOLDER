// Firebase Storage access for report photos (F-007).
// Traces to: docs/09-data-model.md (Storage objects), backend/storage.rules.
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase.js';

// Uploads an already-processed (EXIF-stripped, see photo.js) image blob for the given uid.
// Returns the Storage object PATH, not a download URL — resolve to a URL at display time
// instead, so a stored report never goes stale if the file is later moved/reprocessed.
export async function uploadReportPhoto(uid, blob) {
  const path = `reports/${uid}/${Date.now()}-photo.jpg`;
  await uploadBytes(ref(storage, path), blob, { contentType: 'image/jpeg' });
  return path;
}

// Resolve a stored photoPath to a display URL at render time.
export function resolvePhotoUrl(photoPath) {
  return getDownloadURL(ref(storage, photoPath));
}
