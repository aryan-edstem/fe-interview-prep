import type { RequestHandler } from 'msw';

// A question that needs a mock API exports `handlers` from `src/questions/<id>/mocks.ts`. They are
// collected here so the browser worker and the Vitest server share one source of truth, and adding
// a question's mocks never edits a shared file.
const modules = import.meta.glob<{ handlers: RequestHandler[] }>('../questions/*/mocks.ts', {
  eager: true,
});

export const handlers: RequestHandler[] = Object.values(modules).flatMap((m) => m.handlers);
