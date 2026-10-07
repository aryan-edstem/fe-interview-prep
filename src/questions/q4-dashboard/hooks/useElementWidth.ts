import { useEffect, useRef, useState } from 'react';

/**
 * Tracks an element's rendered width with a ResizeObserver, so an SVG can draw in real pixels
 * (text and strokes keep their size) instead of scaling a fixed viewBox. Uses `fallback` until the
 * first measurement, or for good where ResizeObserver is unavailable (e.g. jsdom).
 */
export function useElementWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry && entry.contentRect.width > 0) setWidth(Math.round(entry.contentRect.width));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}
