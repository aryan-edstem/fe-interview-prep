import { useEffect, useState } from 'react';
import { fetchPost, HttpError } from '../api/posts';
import type { Post } from '../types';

export type PostState =
  | { kind: 'loading' }
  | { kind: 'not-found' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; post: Post };

type Settled = Exclude<PostState, { kind: 'loading' }>;

/** Loads one post; a new id or a retry starts a fresh request and aborts the previous one. */
export function usePost(id: number) {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<{ key: string; state: Settled } | null>(null);
  const key = `${id}:${attempt}`;

  useEffect(() => {
    const controller = new AbortController();
    fetchPost(id, controller.signal).then(
      (post) => {
        if (!controller.signal.aborted) setSettled({ key, state: { kind: 'ready', post } });
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        const state: Settled =
          error instanceof HttpError && error.status === 404
            ? { kind: 'not-found' }
            : {
                kind: 'error',
                message: error instanceof Error ? error.message : 'Something went wrong',
              };
        setSettled({ key, state });
      },
    );
    return () => controller.abort();
  }, [id, key]);

  // Anything settled for another id/attempt is stale: we're loading the current one.
  const state: PostState = settled?.key === key ? settled.state : { kind: 'loading' };
  return { state, retry: () => setAttempt((n) => n + 1) };
}
