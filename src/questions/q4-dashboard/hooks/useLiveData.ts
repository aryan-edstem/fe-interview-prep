import { useEffect, useState } from 'react';

/**
 * `ready` keeps the last good data even when a later refresh fails; `error` there is the message of
 * the most recent failed refresh (cleared by the next success).
 */
export type LiveDataState<T> =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; data: T; error: string | null };

export interface LiveDataOptions {
  /** Delay between one request settling and the next one starting. */
  intervalMs: number;
  /**
   * While `false`, nothing is in flight and nothing is scheduled. Turning it back on fetches
   * immediately, then resumes the interval.
   */
  enabled: boolean;
}

function toMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong';
}

/**
 * Polls `fetcher` every `intervalMs`. The next request is scheduled only after the current one
 * settles (chained `setTimeout`, not `setInterval`), so at most one request is ever in flight and a
 * slow API can't make requests pile up. Disabling or unmounting aborts the in-flight request and
 * clears the timer. `fetcher` must be referentially stable (e.g. a module-level function).
 */
export function useLiveData<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  { intervalMs, enabled }: LiveDataOptions,
): LiveDataState<T> {
  const [state, setState] = useState<LiveDataState<T>>({ kind: 'loading' });

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      try {
        const data = await fetcher(controller.signal);
        if (controller.signal.aborted) return;
        setState({ kind: 'ready', data, error: null });
      } catch (error) {
        if (controller.signal.aborted) return;
        const message = toMessage(error);
        setState((prev) =>
          prev.kind === 'ready' ? { ...prev, error: message } : { kind: 'error', message },
        );
      }
      timer = setTimeout(() => void poll(), intervalMs);
    }

    void poll();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [fetcher, intervalMs, enabled]);

  return state;
}
