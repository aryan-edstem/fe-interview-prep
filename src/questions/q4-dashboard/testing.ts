import { http, HttpResponse } from 'msw';
import { act } from '@testing-library/react';
import { server } from '@/test/setup';
import { DASHBOARD_URL } from './api';
import type { DashboardResponse, Order } from './types';

export function makeOrder(id: string, amount = 42): Order {
  return { id, customer: 'Ada Lovelace', amount, status: 'paid', placedAt: 0 };
}

interface SnapshotInput {
  generatedAt: number;
  total: number;
  users?: number;
  orders?: Order[];
}

export function makeSnapshot({
  generatedAt,
  total,
  users = 120,
  orders = [makeOrder('ORD-1')],
}: SnapshotInput): DashboardResponse {
  return {
    generatedAt,
    sales: { totalToday: total, ordersToday: 10 },
    activeUsers: [{ at: generatedAt, count: users }],
    recentOrders: orders,
  };
}

/** A response the test resolves by hand, to simulate an arbitrarily slow API. */
export type Reply = DashboardResponse | 'error' | Promise<DashboardResponse>;

/**
 * Serves `replies` in order (the last one repeats) and records how many requests were made and the
 * most that were ever in flight at once.
 */
export function serveDashboard(...replies: Reply[]) {
  const calls = { count: 0, inFlight: 0, maxInFlight: 0 };
  server.use(
    http.get(DASHBOARD_URL, async () => {
      const reply = replies[Math.min(calls.count, replies.length - 1)];
      if (reply === undefined) throw new Error('serveDashboard needs at least one reply');
      calls.count++;
      calls.inFlight++;
      calls.maxInFlight = Math.max(calls.maxInFlight, calls.inFlight);
      try {
        if (reply === 'error') {
          return HttpResponse.json({ message: 'Unavailable' }, { status: 503 });
        }
        return HttpResponse.json(await reply);
      } finally {
        calls.inFlight--;
      }
    }),
  );
  return calls;
}

/** Pretends the user switched tabs (Page Visibility API). */
export function setTabVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

/** Moves fake time forward and lets the resulting fetches and renders settle. */
export async function advance(ms: number) {
  await act(() => vi.advanceTimersByTimeAsync(ms));
}
