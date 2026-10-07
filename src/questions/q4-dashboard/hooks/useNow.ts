import { useEffect, useState } from 'react';

/**
 * The current time, refreshed every `intervalMs`, for relative labels ("3 min ago"). Only the
 * component using it re-renders on each tick.
 */
export function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
