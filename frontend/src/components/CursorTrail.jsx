// Route-line trail following the cursor on the landing page — a dashed, fading,
// neon path (map/route motif) rendered on a fixed canvas overlay. Mouse-only,
// respects prefers-reduced-motion.
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const TRAIL_MAX_AGE_MS = 400;
const NEON_GRAY = '210, 214, 220';
const NEON_PURPLE = '182, 64, 255';

export default function CursorTrail() {
  const canvasRef = useRef(null);
  const pointsRef = useRef([]);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let rafId;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    function handleMouseMove(e) {
      pointsRef.current.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    }
    window.addEventListener('mousemove', handleMouseMove);

    function draw() {
      const now = performance.now();
      pointsRef.current = pointsRef.current.filter((p) => now - p.t < TRAIL_MAX_AGE_MS);
      const pts = pointsRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (pts.length > 1) {
        const first = pts[0];
        const last = pts[pts.length - 1];
        const dx = last.x - first.x;
        const dy = last.y - first.y;
        // Live DOM read (not cached in an effect) so there's no race with
        // ThemeProvider's own effect when the theme toggles.
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const NEON = isDark ? NEON_GRAY : NEON_PURPLE;

        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.setLineDash([1, 9]);
        ctx.shadowColor = `rgba(${NEON}, 0.9)`;
        ctx.shadowBlur = 8;

        if (dx * dx + dy * dy < 1) {
          ctx.strokeStyle = `rgba(${NEON}, 0.6)`;
        } else {
          const grad = ctx.createLinearGradient(first.x, first.y, last.x, last.y);
          grad.addColorStop(0, `rgba(${NEON}, 0)`);
          grad.addColorStop(1, `rgba(${NEON}, 0.95)`);
          ctx.strokeStyle = grad;
        }

        ctx.beginPath();
        ctx.moveTo(first.x, first.y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();

        // The dash pattern above is mostly gap, so its last mark can land short of the
        // true cursor position. Cap it with a short solid segment so the tail always
        // reaches right up to the current pointer, instead of appearing detached.
        const prev = pts[pts.length - 2];
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(last.x, last.y);
        ctx.stroke();

        ctx.shadowBlur = 0;
      }

      rafId = requestAnimationFrame(draw);
    }
    rafId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Portal to document.body so this overlay is never a DOM child of `.landing` — that
  // avoids `.landing > *:not(.landing-bg-abstracts)` (styles.css) clobbering our
  // position/z-index via higher selector specificity.
  return createPortal(
    <canvas ref={canvasRef} className="cursor-trail-canvas" aria-hidden="true" />,
    document.body
  );
}
