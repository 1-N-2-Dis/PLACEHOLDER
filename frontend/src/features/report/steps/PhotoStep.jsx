// Report form section: photo (optional).
// Two separate file inputs, not one: a `capture` input opens the device camera directly (no
// chooser), and a plain input opens the gallery/file browser directly. Combining both attributes
// on one input leaves the OS's own chooser dialog in charge instead, which is what this replaces.
// Traces to: docs/03-prd.md F-002/F-007, docs/superpowers/specs/2026-07-01-report-wizard-frontend-design.md.
import { useEffect, useRef, useState } from 'react';
import { Camera, Image } from 'lucide-react';

export default function PhotoStep({ photoFile, onChange }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  useEffect(() => {
    if (!photoFile) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(photoFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  function handlePicked(e) {
    onChange(e.target.files?.[0] || null);
    e.target.value = ''; // allow re-picking the same file
  }

  return (
    <section className="report-step">
      <h2>Add a photo (optional)</h2>
      <p className="muted">A photo helps others trust the report, but isn't required.</p>

      <div className="photo-pick-buttons">
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => cameraInputRef.current?.click()}>
          <Camera size={14} /> Take a photo
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => galleryInputRef.current?.click()}>
          <Image size={14} /> Choose from gallery
        </button>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png"
        capture="environment"
        hidden
        onChange={handlePicked}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png"
        hidden
        onChange={handlePicked}
      />

      {previewUrl && <img className="photo-preview" src={previewUrl} alt="Selected report evidence" />}
    </section>
  );
}
