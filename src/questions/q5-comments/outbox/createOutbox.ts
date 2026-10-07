import { NetworkError } from '../api/commentsApi';
import type { Comment, CommentDraft, OutboxItem } from '../types';

export const OUTBOX_STORAGE_KEY = 'q5-comments:outbox';

export interface OutboxOptions {
  send: (draft: CommentDraft, signal: AbortSignal) => Promise<Comment>;
  isOnline: () => boolean;
  storageKey?: string;
  createId?: () => string;
  /** Pause before resending after a network error while the browser still reports online. */
  networkRetryMs?: number;
}

export interface Outbox {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => readonly OutboxItem[];
  /** Adds a comment to the end of the queue and starts sending if possible. */
  add: (author: string, body: string) => OutboxItem;
  /** Re-queues a failed comment with the same `clientId`, so the server can de-duplicate it. */
  retry: (clientId: string) => void;
  /** Drops a failed comment from the queue. */
  discard: (clientId: string) => void;
  /**
   * Marks every unsent item the server already has as sent, then resumes sending. Without this, a
   * comment saved on a request whose response was lost would stay `failed` locally and block the
   * queue even though the thread shows it as confirmed.
   */
  acknowledge: (serverComments: readonly Comment[]) => void;
  /** Sends the next queued comment, if online and nothing is already in flight. */
  flush: () => void;
  /** Begins processing (on mount). */
  start: () => void;
  /** Aborts the in-flight request and ignores late results (on unmount). */
  stop: () => void;
}

function isStoredItem(value: unknown): value is OutboxItem {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  const base = ['clientId', 'author', 'body', 'createdAt'].every((k) => typeof v[k] === 'string');
  if (!base) return false;
  if (v.status === 'failed') return typeof v.error === 'string';
  return v.status === 'queued' || v.status === 'sending';
}

function load(key: string): OutboxItem[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // A request that was in flight when the page closed may or may not have reached the server.
    // Re-queue it: the idempotency key makes the replay safe.
    return parsed
      .filter(isStoredItem)
      .map((item) => (item.status === 'sending' ? { ...item, status: 'queued' } : item));
  } catch {
    return [];
  }
}

const toDraft = ({ clientId, author, body }: OutboxItem): CommentDraft => ({
  clientId,
  author,
  body,
});

/**
 * A serial outbox for comments. Items are sent strictly one at a time, in insertion order, and a
 * failed item blocks the ones behind it until it is retried or discarded — that is what guarantees
 * the server sees comments in the order they were written.
 *
 * Unsent items are mirrored to localStorage so they survive a refresh. Confirmed (`sent`) items stay
 * in memory only, for the UI to show until the server list catches up.
 */
export function createOutbox({
  send,
  isOnline,
  storageKey = OUTBOX_STORAGE_KEY,
  createId = () => crypto.randomUUID(),
  networkRetryMs = 3000,
}: OutboxOptions): Outbox {
  let items: readonly OutboxItem[] = load(storageKey);
  const listeners = new Set<() => void>();
  let active = false;
  // Bumped by start/stop, so a response from a previous session can't touch current state.
  let session = 0;
  // The single in-flight lock: at most one request at a time, however many triggers fire.
  let inFlight: AbortController | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;

  function setItems(next: readonly OutboxItem[]) {
    items = next;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(items.filter((item) => item.status !== 'sent')),
      );
    } catch {
      // Storage full or blocked: the queue still works for this session.
    }
    listeners.forEach((listener) => listener());
  }

  function replace(clientId: string, update: (item: OutboxItem) => OutboxItem) {
    setItems(items.map((item) => (item.clientId === clientId ? update(item) : item)));
  }

  async function sendItem(item: OutboxItem, controller: AbortController, mySession: number) {
    const draft = toDraft(item);
    replace(item.clientId, (current) => ({ ...current, ...draft, status: 'sending' }));
    let next: OutboxItem;
    let networkError = false;
    try {
      const comment = await send(draft, controller.signal);
      next = { ...draft, createdAt: item.createdAt, status: 'sent', comment };
    } catch (err) {
      // No response at all: the connection dropped (the `online`/`offline` events may fire before
      // or after the rejection), so keep it queued rather than asking the user to retry. Replaying
      // later is safe because of the idempotency key.
      networkError = err instanceof NetworkError;
      next = networkError
        ? { ...draft, createdAt: item.createdAt, status: 'queued' }
        : {
            ...draft,
            createdAt: item.createdAt,
            status: 'failed',
            error: err instanceof Error ? err.message : 'Could not send',
          };
    }
    if (mySession !== session) return;
    inFlight = null;
    // `acknowledge` may have confirmed it from the server list while the request was in flight.
    replace(item.clientId, (current) => (current.status === 'sent' ? current : next));
    if (!networkError) {
      flush();
    } else if (isOnline()) {
      // Still "online" yet unreachable: back off instead of retrying in a tight loop. When offline,
      // the `online` event triggers the next flush.
      clearTimeout(retryTimer);
      retryTimer = setTimeout(flush, networkRetryMs);
    }
  }

  function flush() {
    if (!active || inFlight || !isOnline()) return;
    const head = items.find((item) => item.status !== 'sent');
    // Nothing to do, or the head failed and is waiting for the user — later items keep their place.
    if (!head || head.status !== 'queued') return;
    const controller = new AbortController();
    inFlight = controller;
    void sendItem(head, controller, session);
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => items,
    add(author, body) {
      const item: OutboxItem = {
        clientId: createId(),
        author,
        body,
        createdAt: new Date().toISOString(),
        status: 'queued',
      };
      setItems([...items, item]);
      flush();
      return item;
    },
    retry(clientId) {
      const target = items.find((item) => item.clientId === clientId);
      if (target?.status !== 'failed') return;
      replace(clientId, (item) => ({
        ...toDraft(item),
        createdAt: item.createdAt,
        status: 'queued',
      }));
      flush();
    },
    discard(clientId) {
      const target = items.find((item) => item.clientId === clientId);
      if (target?.status !== 'failed') return;
      setItems(items.filter((item) => item.clientId !== clientId));
      flush();
    },
    acknowledge(serverComments) {
      const saved = new Map(serverComments.map((comment) => [comment.clientId, comment]));
      if (!items.some((item) => item.status !== 'sent' && saved.has(item.clientId))) return;
      setItems(
        items.map((item) => {
          const comment = saved.get(item.clientId);
          return item.status === 'sent' || !comment
            ? item
            : { ...toDraft(item), createdAt: item.createdAt, status: 'sent', comment };
        }),
      );
      flush();
    },
    flush,
    start() {
      session += 1;
      active = true;
      // Anything left "sending" by an aborted session is resent (same key, so no duplicate).
      if (items.some((item) => item.status === 'sending')) {
        setItems(
          items.map((item) =>
            item.status === 'sending'
              ? { ...toDraft(item), createdAt: item.createdAt, status: 'queued' }
              : item,
          ),
        );
      }
      flush();
    },
    stop() {
      session += 1;
      active = false;
      clearTimeout(retryTimer);
      inFlight?.abort();
      inFlight = null;
    },
  };
}
