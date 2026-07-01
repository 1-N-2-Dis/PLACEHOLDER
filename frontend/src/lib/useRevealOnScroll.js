// Reveals an element with the `.fade-up` class once it first scrolls into view.
// Plain IntersectionObserver — no animation library. Safe under React 18 StrictMode's
// double-invoked effects: the "revealed" ref makes a duplicate dev-mode run a no-op.
import { useEffect, useRef } from 'react';

export default function useRevealOnScroll() {
  const ref = useRef(null);
  const revealed = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || revealed.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          revealed.current = true;
          el.classList.add('fade-up');
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}
