import type { DashboardResponse } from './types';

/**
 * Folds a fresh response into what is on screen. A response whose snapshot is not newer than the
 * one already shown (a slow request overtaken by a faster one, a cached replica, ...) is ignored by
 * returning `prev` unchanged, so newer data is never replaced by older data.
 */
export function mergeDashboard(
  prev: DashboardResponse | null,
  next: DashboardResponse,
): DashboardResponse {
  if (prev && next.generatedAt <= prev.generatedAt) return prev;
  return next;
}
