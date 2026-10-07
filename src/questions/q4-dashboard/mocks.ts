import { delay, http, HttpResponse } from 'msw';
import { DASHBOARD_URL } from './api';
import type { ActiveUsersPoint, DashboardResponse, Order, OrderStatus } from './types';

const SAMPLE_SPACING_MS = 5_000;
const SERIES_LENGTH = 20;
const MAX_ORDERS = 6;
const CUSTOMERS = [
  'Ada Lovelace',
  'Grace Hopper',
  'Alan Turing',
  'Katherine Johnson',
  'Margaret Hamilton',
  'Radia Perlman',
  'Edsger Dijkstra',
  'Barbara Liskov',
] as const;
const STATUSES: readonly OrderStatus[] = ['paid', 'paid', 'shipped', 'refunded'];

function randomInt(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function pick<T>(items: readonly T[], fallback: T): T {
  return items[Math.floor(Math.random() * items.length)] ?? fallback;
}

/**
 * In-memory "analytics backend". Every call advances the world: a new active-users sample always
 * lands, while sales and orders only move some of the time — so the client sees some widgets'
 * data change and others stay identical, like a real dashboard.
 */
function createDashboardFeed() {
  let orderSeq = 1040;
  let sales = { totalToday: 18_420.5, ordersToday: 132 };
  let orders: Order[] = [];
  const start = Date.now();
  let series: ActiveUsersPoint[] = Array.from({ length: SERIES_LENGTH }, (_, i) => ({
    at: start - (SERIES_LENGTH - i) * SAMPLE_SPACING_MS,
    count: randomInt(180, 260),
  }));

  function placeOrder(now: number) {
    const amount = randomInt(1_500, 32_000) / 100;
    const order: Order = {
      id: `ORD-${++orderSeq}`,
      customer: pick(CUSTOMERS, 'Guest'),
      amount,
      status: pick(STATUSES, 'paid'),
      placedAt: now,
    };
    orders = [order, ...orders].slice(0, MAX_ORDERS);
    sales = { totalToday: sales.totalToday + amount, ordersToday: sales.ordersToday + 1 };
  }

  for (let i = 0; i < 4; i++) placeOrder(start - (4 - i) * 60_000);

  return function next(): DashboardResponse {
    const now = Date.now();
    const last = series.at(-1)?.count ?? 200;
    series = [...series, { at: now, count: Math.max(40, last + randomInt(-30, 30)) }].slice(
      -SERIES_LENGTH,
    );
    if (Math.random() < 0.4) placeOrder(now);
    return { generatedAt: now, sales, activeUsers: series, recentOrders: orders };
  };
}

const nextSnapshot = createDashboardFeed();

/** Mostly sub-second, but ~15% of calls take longer than the 5s poll interval. */
function randomLatency() {
  return Math.random() < 0.15 ? randomInt(5_500, 7_500) : randomInt(150, 900);
}

export const handlers = [
  http.get(DASHBOARD_URL, async () => {
    // Snapshot before the delay, as a real server would: a slow response carries older data.
    const snapshot = nextSnapshot();
    await delay(randomLatency());
    if (Math.random() < 0.1) {
      return HttpResponse.json({ message: 'Analytics service unavailable' }, { status: 503 });
    }
    return HttpResponse.json(snapshot);
  }),
];
