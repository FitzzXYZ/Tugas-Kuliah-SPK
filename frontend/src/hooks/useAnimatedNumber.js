import { useEffect, useRef, useState } from 'react';

// Animasi interpolasi angka halus (hanya mengubah angka yang ditampilkan, mematuhi prefers-reduced-motion).
export function useAnimatedNumber(target, durationMs = 380) {
  const safeTarget = Number.isFinite(Number(target)) ? Number(target) : 0;
  const [display, setDisplay] = useState(safeTarget);
  const currentRef = useRef(safeTarget);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || durationMs <= 0) {
      currentRef.current = safeTarget;
      setDisplay(safeTarget);
      return undefined;
    }

    const from = currentRef.current;
    const delta = safeTarget - from;
    if (Math.abs(delta) < 1e-4) {
      currentRef.current = safeTarget;
      setDisplay(safeTarget);
      return undefined;
    }

    let frameId = 0;
    const start = performance.now();

    function step(now) {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      // Exponential ease-out tanpa overshoot
      const eased = 1 - (1 - t) ** 3;
      const next = from + delta * eased;
      currentRef.current = next;
      setDisplay(next);
      if (t < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        currentRef.current = safeTarget;
        setDisplay(safeTarget);
      }
    }

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [safeTarget, durationMs]);

  return display;
}
