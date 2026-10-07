import { isDeepEqual, mergeDashboard } from './dashboardData';
import { makeOrder, makeSnapshot } from './testing';

describe('mergeDashboard', () => {
  it('builds per-widget slices stamped with the snapshot time', () => {
    const data = mergeDashboard(null, makeSnapshot({ generatedAt: 1_000, total: 100 }));
    expect(data.generatedAt).toBe(1_000);
    expect(data.sales).toEqual({ value: { totalToday: 100, ordersToday: 10 }, updatedAt: 1_000 });
    expect(data.recentOrders.updatedAt).toBe(1_000);
  });

  it('reuses unchanged slices by reference and replaces changed ones', () => {
    const prev = mergeDashboard(null, makeSnapshot({ generatedAt: 1_000, total: 100 }));
    const next = mergeDashboard(prev, makeSnapshot({ generatedAt: 2_000, total: 200 }));

    expect(next.recentOrders).toBe(prev.recentOrders);
    expect(next.recentOrders.updatedAt).toBe(1_000);
    expect(next.sales).not.toBe(prev.sales);
    expect(next.sales.updatedAt).toBe(2_000);
  });

  it('ignores responses that are not newer than what is shown', () => {
    const prev = mergeDashboard(null, makeSnapshot({ generatedAt: 2_000, total: 100 }));
    expect(mergeDashboard(prev, makeSnapshot({ generatedAt: 1_000, total: 999 }))).toBe(prev);
    expect(mergeDashboard(prev, makeSnapshot({ generatedAt: 2_000, total: 999 }))).toBe(prev);
  });
});

describe('isDeepEqual', () => {
  it('compares JSON-shaped values structurally', () => {
    expect(isDeepEqual([makeOrder('A')], [makeOrder('A')])).toBe(true);
    expect(isDeepEqual([makeOrder('A')], [makeOrder('A', 7)])).toBe(false);
    expect(isDeepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(isDeepEqual([], {})).toBe(false);
    expect(isDeepEqual(null, {})).toBe(false);
  });
});
