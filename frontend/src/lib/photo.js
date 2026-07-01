// Client-side photo prep for report evidence (F-007).
// Role: strip EXIF metadata (GPS, camera info) before a photo ever leaves the device.
// Traces to: docs/12-security-compliance.md Threat T7.
//
// TECHNIQUE: redrawing the image onto a canvas and re-exporting via canvas.toBlob() inherently
// drops EXIF — the canvas pixel buffer carries no metadata — so no EXIF library is needed. This
// does NOT mitigate bystander-face privacy in the photo content itself; that remains a known,
// unmitigated gap (see docs/12-security-compliance.md Threat T7).
export async function stripExifAndResize(file, maxDim = 1600) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not process photo.'))),
      'image/jpeg',
      0.85,
    );
  });
}
