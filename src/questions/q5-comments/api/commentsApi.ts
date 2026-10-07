import type { Comment, CommentDraft } from '../types';

/** The request never got a response (offline, DNS, aborted, ...). Safe to replay later. */
export class NetworkError extends Error {
  override name = 'NetworkError';
}

/** The server answered with a non-2xx status. */
export class HttpError extends Error {
  override name = 'HttpError';
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request(input: string, init: RequestInit): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(input, init);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new NetworkError('Network unavailable');
  }
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof data.message === 'string'
        ? data.message
        : `Request failed (${res.status})`;
    throw new HttpError(res.status, message);
  }
  return data;
}

export function isComment(value: unknown): value is Comment {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return ['id', 'clientId', 'author', 'body', 'createdAt'].every((k) => typeof v[k] === 'string');
}

export async function fetchComments(signal?: AbortSignal): Promise<Comment[]> {
  const data = await request('/api/comments', { signal });
  if (!Array.isArray(data) || !data.every(isComment)) throw new Error('Malformed comments');
  return data;
}

/**
 * Creates a comment. `clientId` doubles as the `Idempotency-Key`, so replaying the same draft after
 * an ambiguous failure returns the already-saved comment instead of creating a second one.
 */
export async function postComment(draft: CommentDraft, signal?: AbortSignal): Promise<Comment> {
  const data = await request('/api/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': draft.clientId },
    body: JSON.stringify(draft),
    signal,
  });
  if (!isComment(data)) throw new Error('Malformed comment');
  return data;
}
