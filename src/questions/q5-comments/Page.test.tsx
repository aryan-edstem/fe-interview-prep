import { act, screen, waitFor, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { http } from 'msw';
import { renderRoute } from '@/test/renderRoute';
import { server } from '@/test/setup';
import { getMockComments, mockCommentsConfig, resetMockComments } from './mocks';
import { OUTBOX_STORAGE_KEY } from './outbox/createOutbox';

const SEED_BODY = /shipped the new onboarding flow/i;

function setOnline(online: boolean) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => online });
  act(() => {
    window.dispatchEvent(new Event(online ? 'online' : 'offline'));
  });
}

/** Queue of outcomes for upcoming requests; empty means success (see `mockCommentsConfig.random`). */
let rolls: number[];
let postKeys: string[];

function recordPost({ request }: { request: Request }) {
  if (request.method === 'POST') postKeys.push(request.headers.get('Idempotency-Key') ?? '');
}

beforeEach(() => {
  localStorage.clear();
  resetMockComments();
  rolls = [];
  postKeys = [];
  Object.assign(mockCommentsConfig, {
    minDelayMs: 0,
    maxDelayMs: 0,
    random: () => rolls.shift() ?? 0.99,
  });
  server.events.on('request:start', recordPost);
});

afterEach(() => {
  server.events.removeListener('request:start', recordPost);
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => true });
});

async function renderThread() {
  const view = renderRoute('/comments');
  await screen.findByText(SEED_BODY);
  return view;
}

async function postComment(user: UserEvent, body: string) {
  await user.type(screen.getByRole('textbox', { name: /add a comment/i }), body);
  await user.click(screen.getByRole('button', { name: /post comment/i }));
}

const commentList = () => screen.getByRole('list', { name: 'Comments' });
const newServerComments = () => getMockComments().slice(2);

test('shows a new comment immediately as sending, then as sent', async () => {
  const { user } = await renderThread();
  // Hold the POST until released; returning nothing falls through to the real mock handler.
  let release = () => {};
  const gate = new Promise<void>((resolve) => (release = resolve));
  server.use(http.post('/api/comments', () => gate));

  await postComment(user, 'Looks good to me');

  const item = screen.getByRole('article', { name: /comment by you/i });
  expect(within(item).getByText('Looks good to me')).toBeInTheDocument();
  expect(within(item).getByText('Sending…')).toBeInTheDocument();

  release();
  expect(await within(item).findByText('Sent')).toBeInTheDocument();
  expect(newServerComments().map((c) => c.body)).toEqual(['Looks good to me']);
});

test('queues comments while offline and sends all of them in order, once each, on reconnect', async () => {
  const { user } = await renderThread();

  setOnline(false);
  expect(screen.getByRole('alert')).toHaveTextContent(/you're offline/i);
  await postComment(user, 'First');
  await postComment(user, 'Second');
  await postComment(user, 'Third');

  expect(within(commentList()).getAllByText('Queued — offline')).toHaveLength(3);
  expect(screen.getByRole('alert')).toHaveTextContent(/3 comments are queued/i);
  expect(postKeys).toHaveLength(0);

  setOnline(true);
  // A second reconnect signal while the queue is flushing must not double-send.
  act(() => {
    window.dispatchEvent(new Event('online'));
  });

  await waitFor(() => expect(within(commentList()).getAllByText('Sent')).toHaveLength(3));
  expect(newServerComments().map((c) => c.body)).toEqual(['First', 'Second', 'Third']);
  expect(postKeys).toEqual(newServerComments().map((c) => c.clientId));
  for (const body of ['First', 'Second', 'Third']) {
    expect(within(commentList()).getAllByText(body)).toHaveLength(1);
  }
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test('marks a failed comment with Retry, and retrying does not create a duplicate', async () => {
  const { user } = await renderThread();
  rolls = [0.15]; // The server saves the comment but the response fails.

  await postComment(user, 'Did this arrive?');

  const item = screen.getByRole('article', { name: /comment by you/i });
  expect(await within(item).findByText('Failed to send')).toBeInTheDocument();
  expect(newServerComments()).toHaveLength(1);

  await user.click(within(item).getByRole('button', { name: 'Retry' }));

  expect(await within(item).findByText('Sent')).toBeInTheDocument();
  expect(postKeys).toHaveLength(2);
  expect(new Set(postKeys).size).toBe(1);
  expect(newServerComments().map((c) => c.body)).toEqual(['Did this arrive?']);
  expect(within(commentList()).getAllByText('Did this arrive?')).toHaveLength(1);
});

test('holds later comments behind a failed one so order is preserved', async () => {
  const { user } = await renderThread();
  rolls = [0.05]; // Fails before saving.

  await postComment(user, 'One');
  await screen.findByText('Failed to send');
  await postComment(user, 'Two');

  expect(screen.getByText('Queued — waiting for an earlier comment')).toBeInTheDocument();
  expect(postKeys).toHaveLength(1);

  await user.click(screen.getByRole('button', { name: 'Retry' }));

  await waitFor(() => expect(within(commentList()).getAllByText('Sent')).toHaveLength(2));
  expect(newServerComments().map((c) => c.body)).toEqual(['One', 'Two']);
});

test('discarding a failed comment removes it and lets the queue continue', async () => {
  const { user } = await renderThread();
  rolls = [0.05];

  await postComment(user, 'Typo');
  await screen.findByText('Failed to send');
  await postComment(user, 'Fixed');
  await user.click(screen.getByRole('button', { name: 'Discard' }));

  await within(commentList()).findByText('Sent');
  expect(screen.queryByText('Typo')).not.toBeInTheDocument();
  expect(newServerComments().map((c) => c.body)).toEqual(['Fixed']);
});

test('queued comments survive a refresh and are sent once back online', async () => {
  const first = await renderThread();
  setOnline(false);
  await postComment(first.user, 'Written on the train');
  await postComment(first.user, 'Still no signal');
  first.unmount();

  await renderThread();
  expect(within(commentList()).getAllByText('Queued — offline')).toHaveLength(2);
  expect(screen.getByText('Written on the train')).toBeInTheDocument();

  setOnline(true);

  await waitFor(() => expect(within(commentList()).getAllByText('Sent')).toHaveLength(2));
  expect(newServerComments().map((c) => c.body)).toEqual([
    'Written on the train',
    'Still no signal',
  ]);
  expect(postKeys).toHaveLength(2);
});

test('shows a load error with a retry', async () => {
  rolls = [0];
  const { user } = renderRoute('/comments');

  expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't load comments/i);
  await user.click(screen.getByRole('button', { name: /try again/i }));

  expect(await screen.findByText(SEED_BODY)).toBeInTheDocument();
});

test('a failed comment the server already saved does not stall the queue', async () => {
  // The server kept "x" (e.g. saved, then the response failed) but this device still holds it as
  // failed, with "y" queued behind it — the state a refresh after a lost response leaves behind.
  await fetch('/api/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'x' },
    body: JSON.stringify({ clientId: 'x', author: 'You', body: 'Saved already' }),
  });
  const createdAt = '2026-10-07T09:00:00.000Z';
  localStorage.setItem(
    OUTBOX_STORAGE_KEY,
    JSON.stringify([
      {
        clientId: 'x',
        author: 'You',
        body: 'Saved already',
        createdAt,
        status: 'failed',
        error: 'Gateway timeout',
      },
      { clientId: 'y', author: 'You', body: 'Written after', createdAt, status: 'queued' },
    ]),
  );
  postKeys = [];

  await renderThread();

  await waitFor(() => expect(within(commentList()).getAllByText('Sent')).toHaveLength(2));
  expect(postKeys).toEqual(['y']);
  expect(newServerComments().map((c) => c.body)).toEqual(['Saved already', 'Written after']);
  expect(within(commentList()).getAllByText('Saved already')).toHaveLength(1);
  expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
});

test('posts with Ctrl+Enter from the comment box', async () => {
  const { user } = await renderThread();
  const box = screen.getByRole('textbox', { name: /add a comment/i });

  await user.type(box, 'Keyboard first');
  await user.keyboard('{Control>}{Enter}{/Control}');

  expect(await within(commentList()).findByText('Keyboard first')).toBeInTheDocument();
  expect(box).toHaveValue('');
});
