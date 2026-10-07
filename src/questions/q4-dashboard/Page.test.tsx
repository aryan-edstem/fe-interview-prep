import { screen, waitFor } from '@testing-library/react';
import { renderRoute } from '@/test/renderRoute';
import { advance, makeSnapshot, serveDashboard, setTabVisibility } from './testing';

describe('Live dashboard polling', () => {
  // The route lazy-loads Page; warm the module so the first test isn't racing a cold import.
  beforeAll(async () => {
    await import('./Page');
  });

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    setTabVisibility('visible');
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders all three widgets and refreshes every 5 seconds', async () => {
    const calls = serveDashboard(
      makeSnapshot({ generatedAt: 1_000, total: 100 }),
      makeSnapshot({ generatedAt: 2_000, total: 200 }),
    );
    renderRoute('/dashboard');

    expect(await screen.findByText('$100.00')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Sales today' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Active users' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Recent orders' })).toBeInTheDocument();
    expect(calls.count).toBe(1);

    await advance(4_000);
    expect(calls.count).toBe(1);
    await advance(1_000);
    expect(await screen.findByText('$200.00')).toBeInTheDocument();
    expect(calls.count).toBe(2);
  });

  it('stops requesting while the tab is hidden and fetches straight away on return', async () => {
    const calls = serveDashboard(
      makeSnapshot({ generatedAt: 1_000, total: 100 }),
      makeSnapshot({ generatedAt: 2_000, total: 200 }),
    );
    renderRoute('/dashboard');
    await screen.findByText('$100.00');

    setTabVisibility('hidden');
    expect(screen.getByText('Paused while this tab is hidden')).toBeInTheDocument();
    await advance(30_000);
    expect(calls.count).toBe(1);

    setTabVisibility('visible');
    expect(await screen.findByText('$200.00')).toBeInTheDocument();
    expect(calls.count).toBe(2);
    expect(screen.getByText('Live')).toBeInTheDocument();

    await advance(5_000);
    await waitFor(() => expect(calls.count).toBe(3));
  });

  it('never replaces newer data with an older, late response', async () => {
    const calls = serveDashboard(
      makeSnapshot({ generatedAt: 2_000, total: 100 }),
      // Snapshotted before the one already on screen, e.g. served by a lagging replica.
      makeSnapshot({ generatedAt: 1_000, total: 999 }),
      makeSnapshot({ generatedAt: 3_000, total: 300 }),
    );
    renderRoute('/dashboard');
    await screen.findByText('$100.00');

    await advance(5_000);
    await waitFor(() => expect(calls.count).toBe(2));
    await advance(1_000);
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.queryByText('$999.00')).not.toBeInTheDocument();

    await advance(4_000);
    expect(await screen.findByText('$300.00')).toBeInTheDocument();
  });

  it('waits for a slow response instead of piling up requests', async () => {
    let release: (value: ReturnType<typeof makeSnapshot>) => void = () => {};
    const slow = new Promise<ReturnType<typeof makeSnapshot>>((resolve) => {
      release = resolve;
    });
    const calls = serveDashboard(
      makeSnapshot({ generatedAt: 1_000, total: 100 }),
      slow,
      makeSnapshot({ generatedAt: 3_000, total: 300 }),
    );
    renderRoute('/dashboard');
    await screen.findByText('$100.00');

    await advance(5_000);
    await waitFor(() => expect(calls.count).toBe(2));
    // The second request is still pending well past several intervals: nothing new is sent.
    await advance(20_000);
    expect(calls.count).toBe(2);

    release(makeSnapshot({ generatedAt: 2_000, total: 200 }));
    expect(await screen.findByText('$200.00')).toBeInTheDocument();
    await advance(5_000);
    expect(await screen.findByText('$300.00')).toBeInTheDocument();
    expect(calls.count).toBe(3);
    expect(calls.maxInFlight).toBe(1);
  });

  it('keeps the last good data and an error badge when a refresh fails, then recovers', async () => {
    serveDashboard(
      makeSnapshot({ generatedAt: 1_000, total: 100 }),
      'error',
      makeSnapshot({ generatedAt: 3_000, total: 300 }),
    );
    renderRoute('/dashboard');
    await screen.findByText('$100.00');

    await advance(5_000);
    expect(await screen.findByText(/Refresh failed/)).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();

    await advance(5_000);
    expect(await screen.findByText('$300.00')).toBeInTheDocument();
    expect(screen.queryByText(/Refresh failed/)).not.toBeInTheDocument();
  });

  it('shows an error and keeps retrying when the first load fails', async () => {
    serveDashboard('error', makeSnapshot({ generatedAt: 1_000, total: 100 }));
    renderRoute('/dashboard');

    expect(await screen.findByRole('alert')).toHaveTextContent(/Couldn.t load the dashboard/);
    await advance(5_000);
    expect(await screen.findByText('$100.00')).toBeInTheDocument();
  });
});
