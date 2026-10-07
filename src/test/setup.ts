import '@testing-library/jest-dom/vitest';
import { setupServer } from 'msw/node';
import { handlers } from '@/mocks/handlers';

// Same handlers as the browser worker. Unhandled requests fail the test, so no test ever hits the
// real network — mock external APIs (e.g. dummyjson) with `server.use(...)` in the test itself.
export const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
