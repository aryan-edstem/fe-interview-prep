import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { startMockWorker } from '@/mocks/browser';
import '@/index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

// Mocked APIs must be intercepting before the first request fires.
await startMockWorker();

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
