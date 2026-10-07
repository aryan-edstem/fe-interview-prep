import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { fetchComments, postComment } from '../api/commentsApi';
import { createOutbox } from '../outbox/createOutbox';
import type { Comment, OutboxItem, ThreadEntry } from '../types';
import { useOnlineStatus } from './useOnlineStatus';

export const CURRENT_AUTHOR = 'You';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'loaded'; comments: Comment[] };

export interface OutboxSummary {
  queued: number;
  sending: number;
  failed: number;
}

/**
 * Merges the server's list with this device's outbox, keyed by `clientId`, so a comment is shown
 * exactly once: as confirmed when the server has it, otherwise as pending in queue order.
 */
export function buildThread(serverComments: readonly Comment[], items: readonly OutboxItem[]) {
  const seen = new Set(serverComments.map((c) => c.clientId));
  const entries: ThreadEntry[] = serverComments.map((comment) => ({ kind: 'confirmed', comment }));
  for (const item of items) {
    if (item.status === 'sent' && !seen.has(item.clientId)) {
      seen.add(item.clientId);
      entries.push({ kind: 'confirmed', comment: item.comment });
    }
  }
  let blocked = false;
  for (const item of items) {
    if (item.status === 'sent' || seen.has(item.clientId)) continue;
    entries.push({ kind: 'pending', item, blocked });
    if (item.status === 'failed') blocked = true;
  }
  return entries;
}

export function useComments() {
  const online = useOnlineStatus();
  const [outbox] = useState(() =>
    createOutbox({ send: postComment, isOnline: () => navigator.onLine }),
  );
  const items = useSyncExternalStore(outbox.subscribe, outbox.getSnapshot);

  useEffect(() => {
    outbox.start();
    return () => outbox.stop();
  }, [outbox]);

  // Reconnecting flushes the queue; the outbox's in-flight lock makes repeat triggers harmless.
  useEffect(() => {
    if (online) outbox.flush();
  }, [online, outbox]);

  const [load, setLoad] = useState<LoadState>({ kind: 'loading' });
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchComments(controller.signal).then(
      (comments) => {
        // Reconcile first, so the thread and the send queue agree on what the server has.
        outbox.acknowledge(comments);
        setLoad({ kind: 'loaded', comments });
      },
      (err: unknown) => {
        if (controller.signal.aborted) return;
        setLoad({
          kind: 'error',
          message: err instanceof Error ? err.message : 'Could not load comments',
        });
      },
    );
    return () => controller.abort();
  }, [loadAttempt, outbox]);

  const reload = useCallback(() => {
    setLoad({ kind: 'loading' });
    setLoadAttempt((n) => n + 1);
  }, []);

  const thread = useMemo(
    () => buildThread(load.kind === 'loaded' ? load.comments : [], items),
    [load, items],
  );

  const summary: OutboxSummary = { queued: 0, sending: 0, failed: 0 };
  for (const entry of thread) {
    if (entry.kind === 'pending') summary[entry.item.status] += 1;
  }

  return {
    online,
    load,
    reload,
    thread,
    summary,
    post: (body: string) => outbox.add(CURRENT_AUTHOR, body),
    retry: outbox.retry,
    discard: outbox.discard,
  };
}
