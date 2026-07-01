// Report wizard step 1/4: photo (required).
// Traces to: docs/03-prd.md F-002/F-007, docs/superpowers/specs/2026-07-01-report-wizard-frontend-design.md.
import { useEffect, useState } from 'react';

export default function PhotoStep({ photoFile, onChange }) {
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!photoFile) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(photoFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  return (
    <section className="report-step">
      <h2>Add a photo</h2>
      <p className="muted">A photo helps others trust the report. Required to continue.</p>

      <label>
        Photo
        <input
          type="file"
          accept="image/jpeg,image/png"
          capture="environment"
          onChange={(e) => onChange(e.target.files?.[0] || null)}
        />
      </label>

      {previewUrl && <img className="photo-preview" src={previewUrl} alt="Selected report evidence" />}
    </section>
  );
}
