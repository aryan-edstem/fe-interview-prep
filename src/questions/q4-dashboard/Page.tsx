import { fetchDashboard } from './api';
import { ActiveUsersWidget } from './components/ActiveUsersWidget';
import { LiveStatus } from './components/LiveStatus';
import { RecentOrdersWidget } from './components/RecentOrdersWidget';
import { SalesWidget } from './components/SalesWidget';
import { useLiveData } from './hooks/useLiveData';

const POLL_INTERVAL_MS = 5_000;

export default function DashboardPage() {
  const state = useLiveData(fetchDashboard, { intervalMs: POLL_INTERVAL_MS });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Live dashboard</h1>
        <p className="text-sm text-slate-600">
          Sales, active users and the latest orders, refreshed every 5 seconds.
        </p>
        {state.kind === 'ready' && (
          <LiveStatus updatedAt={state.data.generatedAt} error={state.error} />
        )}
      </header>

      {state.kind === 'loading' && (
        <p role="status" className="text-sm text-slate-600">
          Loading dashboard…
        </p>
      )}
      {state.kind === 'error' && (
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
          Couldn&apos;t load the dashboard: {state.message}. Retrying automatically.
        </p>
      )}
      {state.kind === 'ready' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <SalesWidget sales={state.data.sales} />
          <ActiveUsersWidget points={state.data.activeUsers} className="lg:col-span-2" />
          <RecentOrdersWidget orders={state.data.recentOrders} className="lg:col-span-3" />
        </div>
      )}
    </div>
  );
}
