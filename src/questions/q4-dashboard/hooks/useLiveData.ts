import { useEffect, useState } from 'react';

export type LiveDataState<T> =
  { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; data: T };

function toMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong';
}

/** Loads data once on mount, aborting the request if the component unmounts first. */
export function useLiveData<T>(fetcher: (signal: AbortSignal) => Promise<T>): LiveDataState<T> {
  const [state, setState] = useState<LiveDataState<T>>({ kind: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    fetcher(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setState({ kind: 'ready', data });
      },
      (error: unknown) => {
        if (!controller.signal.aborted) setState({ kind: 'error', message: toMessage(error) });
      },
    );
    return () => controller.abort();
  }, [fetcher]);

  return state;
}
