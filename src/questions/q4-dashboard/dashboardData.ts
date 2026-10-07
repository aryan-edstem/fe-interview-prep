import type { DashboardData, DashboardResponse, Slice } from './types';

/** Structural equality for JSON-shaped data (what the API returns). */
export function isDeepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every(
    (key) =>
      Object.hasOwn(b, key) &&
      isDeepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
  );
}

/** Reuses the previous slice object when its value is unchanged, so memoized widgets can bail out. */
function shareSlice<T>(prev: Slice<T> | undefined, value: T, at: number): Slice<T> {
  return prev && isDeepEqual(prev.value, value) ? prev : { value, updatedAt: at };
}

/**
 * Folds a fresh response into what is on screen.
 *
 * - Stale protection: a response whose snapshot is not newer than the one already shown (a slow
 *   request overtaken by a faster one, a cached replica, ...) is ignored by returning `prev`.
 * - Structural sharing: each widget's slice keeps its previous reference when its data is
 *   deep-equal, so only widgets whose data changed re-render.
 */
export function mergeDashboard(prev: DashboardData | null, next: DashboardResponse): DashboardData {
  if (prev && next.generatedAt <= prev.generatedAt) return prev;
  const at = next.generatedAt;
  return {
    generatedAt: at,
    sales: shareSlice(prev?.sales, next.sales, at),
    activeUsers: shareSlice(prev?.activeUsers, next.activeUsers, at),
    recentOrders: shareSlice(prev?.recentOrders, next.recentOrders, at),
  };
}
