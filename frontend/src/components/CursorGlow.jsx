// CursorGlow — a large, soft radial glow that follows the pointer on the
// landing page background.
//   • Light mode → light violet (rgba 182, 90, 255)
//   • Dark mode  → golden yellow (rgba 255, 200, 87)
// Rendered into document.body via a portal so z-index layering is predictable.
// Mouse-only (pointer: fine) + respects prefers-reduced-motion.
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function CursorGlow() {
  const glowRef = useRef(null);

  useEffect(() => {
    // Skip on touch-only or reduced-motion devices.
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const el = glowRef.current;
    if (!el) return;

    let raf;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;

    function onMouseMove(e) {
      targetX = e.clientX;
      targetY = e.clientY;
    }

    // Smooth spring-like follow: lerp toward the real cursor each frame.
    function tick() {
      currentX += (targetX - currentX) * 0.1;
      currentY += (targetY - currentY) * 0.1;
      el.style.transform = `translate(${currentX}px, ${currentY}px)`;
      raf = requestAnimationFrame(tick);
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return createPortal(
    <div ref={glowRef} className="cursor-glow" aria-hidden="true" />,
    document.body
  );
}
