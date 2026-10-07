import { delay, http, HttpResponse } from 'msw';
import { isComment } from './api/commentsApi';
import type { Comment, CommentDraft } from './types';

/**
 * Knobs for the fake comments API. Defaults mimic a flaky network (1-2 s latency, ~20% failures);
 * tests overwrite them for deterministic runs and call `resetMockComments()` between cases.
 */
export const mockCommentsConfig = {
  minDelayMs: 1000,
  maxDelayMs: 2000,
  failureRate: 0.2,
  /** Decides each request's fate: below `failureRate / 2` fails before saving, below `failureRate` saves then fails. */
  random: Math.random,
};

const defaults = { ...mockCommentsConfig };
const STORAGE_KEY = 'q5-comments:mock-server';

const seed: Comment[] = [
  {
    id: 'c1',
    clientId: 'seed-1',
    author: 'Priya',
    body: 'Shipped the new onboarding flow to staging. Feedback welcome!',
    createdAt: '2026-10-06T09:12:00.000Z',
  },
  {
    id: 'c2',
    clientId: 'seed-2',
    author: 'Marco',
    body: 'Looks great. The progress bar on step 3 jumps a little on mobile.',
    createdAt: '2026-10-06T09:40:00.000Z',
  },
];

// The "server" lives in sessionStorage so a page refresh doesn't wipe what it already accepted —
// otherwise reloading would make sent comments vanish while queued ones survive.
function load(): Comment[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every(isComment)) return parsed;
    }
  } catch {
    // Unreadable storage: fall back to the seed thread.
  }
  return [...seed];
}

let store: Comment[] = load();

function save(next: Comment[]) {
  store = next;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage full or blocked: keep the in-memory copy.
  }
}

/** Restores the seed thread and default config (for tests). */
export function resetMockComments() {
  Object.assign(mockCommentsConfig, defaults);
  save([...seed]);
}

/** Read-only view of what the server has stored (for tests). */
export function getMockComments(): readonly Comment[] {
  return store;
}

function latency() {
  const { minDelayMs, maxDelayMs } = mockCommentsConfig;
  return minDelayMs + Math.random() * (maxDelayMs - minDelayMs);
}

function isDraft(value: unknown): value is CommentDraft {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.clientId === 'string' && typeof v.author === 'string' && typeof v.body === 'string'
  );
}

export const handlers = [
  http.get('/api/comments', async () => {
    await delay(latency());
    if (mockCommentsConfig.random() < mockCommentsConfig.failureRate) {
      return HttpResponse.json({ message: 'Could not load comments' }, { status: 503 });
    }
    return HttpResponse.json(store);
  }),

  http.post('/api/comments', async ({ request }) => {
    await delay(latency());
    const body: unknown = await request.json();
    const key = request.headers.get('Idempotency-Key');
    if (!isDraft(body) || !body.body.trim() || key !== body.clientId) {
      return HttpResponse.json({ message: 'Invalid comment' }, { status: 400 });
    }

    const roll = mockCommentsConfig.random();
    if (roll < mockCommentsConfig.failureRate / 2) {
      return HttpResponse.json({ message: 'Server error' }, { status: 500 });
    }

    // Idempotency: a replayed key returns the comment saved the first time, never a new one.
    const existing = store.find((c) => c.clientId === key);
    const comment = existing ?? {
      id: `c${store.length + 1}-${key.slice(0, 8)}`,
      clientId: key,
      author: body.author,
      body: body.body.trim(),
      createdAt: new Date().toISOString(),
    };
    if (!existing) save([...store, comment]);

    if (roll < mockCommentsConfig.failureRate) {
      // Saved, but the response is "lost" — the client sees a failure and will retry the same key.
      return HttpResponse.json({ message: 'Gateway timeout' }, { status: 504 });
    }
    return HttpResponse.json(comment, { status: existing ? 200 : 201 });
  }),
];
