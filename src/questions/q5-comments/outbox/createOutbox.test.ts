import { HttpError, NetworkError } from '../api/commentsApi';
import type { Comment, CommentDraft } from '../types';
import { createOutbox, OUTBOX_STORAGE_KEY } from './createOutbox';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const toComment = (draft: CommentDraft): Comment => ({
  ...draft,
  id: `srv-${draft.clientId}`,
  createdAt: '2026-10-07T10:00:00.000Z',
});

let ids = 0;
const createId = () => `id-${++ids}`;

beforeEach(() => {
  localStorage.clear();
  ids = 0;
});

test('sends one comment at a time however often flush is triggered', async () => {
  const pending: ReturnType<typeof deferred<Comment>>[] = [];
  const send = vi.fn((_draft: CommentDraft) => {
    const d = deferred<Comment>();
    pending.push(d);
    return d.promise;
  });
  const outbox = createOutbox({ send, isOnline: () => true, createId });
  outbox.start();
  outbox.add('You', 'one');
  outbox.add('You', 'two');
  outbox.flush();
  outbox.flush();
  expect(send).toHaveBeenCalledTimes(1);

  pending[0]?.resolve(toComment({ clientId: 'id-1', author: 'You', body: 'one' }));
  await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(2));
  expect(send.mock.calls.map(([draft]) => draft.body)).toEqual(['one', 'two']);
});

test('a failed comment holds later comments back until it is retried', async () => {
  const send = vi
    .fn<(draft: CommentDraft) => Promise<Comment>>()
    .mockRejectedValueOnce(new HttpError(500, 'Server error'))
    .mockImplementation((draft) => Promise.resolve(toComment(draft)));
  const outbox = createOutbox({ send, isOnline: () => true, createId });
  outbox.start();
  outbox.add('You', 'one');
  outbox.add('You', 'two');

  await vi.waitFor(() => expect(outbox.getSnapshot()[0]?.status).toBe('failed'));
  expect(outbox.getSnapshot()[1]?.status).toBe('queued');
  expect(send).toHaveBeenCalledTimes(1);

  outbox.retry('id-1');
  await vi.waitFor(() =>
    expect(outbox.getSnapshot().map((i) => i.status)).toEqual(['sent', 'sent']),
  );
  expect(send.mock.calls.map(([draft]) => draft.clientId)).toEqual(['id-1', 'id-1', 'id-2']);
});

test('persists unsent comments and re-queues one that was mid-send', () => {
  const outbox = createOutbox({
    send: () => new Promise<Comment>(() => {}),
    isOnline: () => true,
    createId,
  });
  outbox.start();
  outbox.add('You', 'in flight');
  outbox.add('You', 'waiting');
  expect(outbox.getSnapshot().map((i) => i.status)).toEqual(['sending', 'queued']);
  outbox.stop();

  const reloaded = createOutbox({ send: vi.fn(), isOnline: () => false });
  expect(reloaded.getSnapshot().map((i) => [i.body, i.status])).toEqual([
    ['in flight', 'queued'],
    ['waiting', 'queued'],
  ]);
  expect(localStorage.getItem(OUTBOX_STORAGE_KEY)).toContain('in flight');
});

test('does not send while offline', () => {
  const send = vi.fn();
  const outbox = createOutbox({ send, isOnline: () => false, createId });
  outbox.start();
  outbox.add('You', 'later');
  outbox.flush();
  expect(send).not.toHaveBeenCalled();
});

test('keeps a comment queued after a network error and resends it with the same key', async () => {
  let online = true;
  const send = vi
    .fn<(draft: CommentDraft) => Promise<Comment>>()
    .mockImplementationOnce(() => {
      online = false; // The connection drops mid-request...
      return Promise.reject(new NetworkError('Network unavailable'));
    })
    .mockImplementation((draft) => Promise.resolve(toComment(draft)));
  const outbox = createOutbox({ send, isOnline: () => online, createId });
  outbox.start();
  outbox.add('You', 'one');

  await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1));
  await vi.waitFor(() => expect(outbox.getSnapshot()[0]?.status).toBe('queued'));

  online = true; // ...and comes back.
  outbox.flush();
  await vi.waitFor(() => expect(outbox.getSnapshot()[0]?.status).toBe('sent'));
  expect(send.mock.calls.map(([draft]) => draft.clientId)).toEqual(['id-1', 'id-1']);
});

test('re-queues on a network error even if the browser already reports online again', async () => {
  vi.useFakeTimers();
  try {
    const send = vi
      .fn<(draft: CommentDraft) => Promise<Comment>>()
      .mockRejectedValueOnce(new NetworkError('Network unavailable'))
      .mockImplementation((draft) => Promise.resolve(toComment(draft)));
    const outbox = createOutbox({ send, isOnline: () => true, createId, networkRetryMs: 1000 });
    outbox.start();
    outbox.add('You', 'one');

    await vi.advanceTimersByTimeAsync(0);
    expect(outbox.getSnapshot()[0]?.status).toBe('queued');
    expect(send).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1000);
    expect(outbox.getSnapshot()[0]?.status).toBe('sent');
    expect(send).toHaveBeenCalledTimes(2);
  } finally {
    vi.useRealTimers();
  }
});
