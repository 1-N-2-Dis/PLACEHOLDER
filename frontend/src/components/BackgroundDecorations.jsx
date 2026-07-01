export function TriangleMesh({ className, style }) {
  return (
    <svg 
      className={className}
      style={{ ...style, position: 'absolute', zIndex: 0, opacity: 0.05, color: 'var(--ink)', pointerEvents: 'none' }}
      width="320" height="320" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="triangles" width="40" height="69.282" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="40" y2="0" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="0" y1="34.641" x2="40" y2="34.641" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="0" y1="69.282" x2="40" y2="69.282" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="0" y1="69.282" x2="40" y2="0" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="-20" y1="34.641" x2="20" y2="-34.641" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="20" y1="103.923" x2="60" y2="34.641" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="0" y1="0" x2="40" y2="69.282" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="20" y1="-34.641" x2="60" y2="34.641" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="-20" y1="34.641" x2="20" y2="103.923" stroke="currentColor" strokeWidth="1.5"/>
        </pattern>
        <clipPath id="mesh-clip">
          <polygon points="0,320 0,0 80,0 80,80 160,80 160,160 240,160 240,240 320,240 320,320" />
        </clipPath>
      </defs>
      <rect width="320" height="320" fill="url(#triangles)" clipPath="url(#mesh-clip)" />
    </svg>
  );
}

export function GradientBlobs({ opacity = 0.4, variant = 'default', style, className = "" }) {
  let transforms = { b1: '', b2: '', b3: '' };
  if (variant === 'profile') {
    transforms = { b1: 'translate(30vw, 20vh)', b2: 'translate(-20vw, -10vh)', b3: 'translate(-10vw, -30vh)' };
  } else if (variant === 'tips') {
    transforms = { b1: 'translate(10vw, 30vh)', b2: 'translate(-10vw, 10vh)', b3: 'translate(20vw, -10vh)' };
  } else if (variant === 'routes') {
    transforms = { b1: 'translate(-20vw, 10vh)', b2: 'translate(-30vw, 20vh)', b3: 'translate(30vw, -10vh)' };
  } else if (variant === 'report') {
    transforms = { b1: 'translate(20vw, 10vh)', b2: 'translate(10vw, -20vh)', b3: 'translate(-30vw, 20vh)' };
  } else if (variant === 'dashboard') {
    transforms = { b1: 'translate(-10vw, 20vh)', b2: 'translate(20vw, 30vh)', b3: 'translate(-20vw, -10vh)' };
  }

  return (
    <>
      <div className="landing-bg-grid" style={{ position: 'fixed', inset: 0, zIndex: -2, opacity: 0.5 }} />
      <div className={`landing-bg-abstracts ${className}`} style={{ opacity, ...style }}>
        <div className="landing-blob blob-1" style={{ transform: transforms.b1 }} />
        <div className="landing-blob blob-2" style={{ transform: transforms.b2 }} />
        <div className="landing-blob blob-3" style={{ transform: transforms.b3 }} />
      </div>
    </>
  );
}
