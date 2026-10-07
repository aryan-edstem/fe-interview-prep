import { getMockComments, mockCommentsConfig, resetMockComments } from './mocks';

const draft = { clientId: 'key-1', author: 'You', body: 'Hello' };

function post(body: object, key = draft.clientId) {
  return fetch('/api/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  resetMockComments();
  Object.assign(mockCommentsConfig, { minDelayMs: 0, maxDelayMs: 0, random: () => 0.99 });
});

test('returns the seeded thread', async () => {
  const res = await fetch('/api/comments');
  expect(res.status).toBe(200);
  expect(await res.json()).toHaveLength(2);
});

test('replaying an idempotency key returns the saved comment instead of a duplicate', async () => {
  const first = await post(draft);
  expect(first.status).toBe(201);
  const second = await post(draft);
  expect(second.status).toBe(200);
  expect(await second.json()).toEqual(await first.json());
  expect(getMockComments().filter((c) => c.clientId === draft.clientId)).toHaveLength(1);
});

test('can save a comment and still fail the response', async () => {
  mockCommentsConfig.random = () => 0.15;
  const res = await post(draft);
  expect(res.status).toBe(504);
  expect(getMockComments().map((c) => c.clientId)).toContain(draft.clientId);
});

test('can fail before saving', async () => {
  mockCommentsConfig.random = () => 0.05;
  const res = await post(draft);
  expect(res.status).toBe(500);
  expect(getMockComments()).toHaveLength(2);
});

test('rejects a body whose clientId does not match the idempotency key', async () => {
  const res = await post(draft, 'other-key');
  expect(res.status).toBe(400);
});
