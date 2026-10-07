import { useEffect, useRef } from 'react';

interface Options {
  /** Observe only while a load is allowed; re-enabling re-checks a sentinel that is still visible. */
  enabled: boolean;
  /** How far below the viewport the sentinel counts as "near". */
  distance?: string;
}

/** Calls `onNear` when the returned ref's element comes within `distance` of the viewport. */
export function useNearBottom<T extends Element>(
  onNear: () => void,
  { enabled, distance = '400px' }: Options,
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!enabled || !element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onNear();
      },
      { rootMargin: `0px 0px ${distance} 0px` },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled, onNear, distance]);

  return ref;
}
