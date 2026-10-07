import type { DashboardResponse } from './types';

export const DASHBOARD_URL = '/api/dashboard';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isDashboardResponse(value: unknown): value is DashboardResponse {
  return (
    isRecord(value) &&
    typeof value.generatedAt === 'number' &&
    isRecord(value.sales) &&
    typeof value.sales.totalToday === 'number' &&
    typeof value.sales.ordersToday === 'number' &&
    Array.isArray(value.activeUsers) &&
    Array.isArray(value.recentOrders)
  );
}

/** Fetches one dashboard snapshot. Rejects on HTTP errors, malformed bodies and aborts. */
export async function fetchDashboard(signal: AbortSignal): Promise<DashboardResponse> {
  const response = await fetch(DASHBOARD_URL, { signal, headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Dashboard request failed (${response.status})`);
  const body: unknown = await response.json();
  if (!isDashboardResponse(body)) throw new Error('Dashboard response was malformed');
  return body;
}
