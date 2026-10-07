/** A comment as the server stores it. `clientId` is the idempotency key the client generated. */
export interface Comment {
  id: string;
  clientId: string;
  author: string;
  body: string;
  /** ISO timestamp assigned by the server; defines thread order. */
  createdAt: string;
}

/** What the client sends to create a comment. */
export interface CommentDraft {
  clientId: string;
  author: string;
  body: string;
}

/**
 * Lifecycle of a comment written on this device.
 * - `queued`: waiting its turn (or waiting for the connection to return)
 * - `sending`: request in flight
 * - `failed`: the server rejected it or the request broke; needs a retry
 * - `sent`: confirmed by the server
 */
export type OutboxStatus = 'queued' | 'sending' | 'failed' | 'sent';

export type OutboxItem = CommentDraft & {
  /** Client clock time the comment was written, for display until the server confirms it. */
  createdAt: string;
} & (
    | { status: 'queued' | 'sending' }
    | { status: 'failed'; error: string }
    | { status: 'sent'; comment: Comment }
  );

/** One row of the rendered thread: a confirmed server comment or a local pending one. */
export type ThreadEntry =
  | { kind: 'confirmed'; comment: Comment }
  | { kind: 'pending'; item: Exclude<OutboxItem, { status: 'sent' }>; blocked: boolean };
