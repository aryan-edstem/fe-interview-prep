import { setupWorker } from 'msw/browser';
import { handlers } from '@/mocks/handlers';

export const worker = setupWorker(...handlers);

/** Starts the mock service worker so mocked endpoints show up as real requests in DevTools. */
export function startMockWorker() {
  return worker.start({
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
    onUnhandledFrame: 'bypass',
    quiet: true,
  });
}
