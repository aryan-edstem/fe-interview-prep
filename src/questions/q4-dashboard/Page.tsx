import { fetchDashboard } from './api';
import { mergeDashboard } from './dashboardData';
import { ActiveUsersWidget } from './components/ActiveUsersWidget';
import { LiveStatus } from './components/LiveStatus';
import { RecentOrdersWidget } from './components/RecentOrdersWidget';
import { SalesWidget } from './components/SalesWidget';
import { WidgetToggles } from './components/WidgetToggles';
import { useLiveData } from './hooks/useLiveData';
import { usePageVisible } from './hooks/usePageVisible';
import { useWidgetPreferences } from './hooks/useWidgetPreferences';

const POLL_INTERVAL_MS = 5_000;

function DashboardSkeleton() {
  return (
    <div role="status" className="grid gap-4 lg:grid-cols-3">
      <span className="sr-only">Loading dashboard…</span>
      <div aria-hidden="true" className="card card-body space-y-4">
        <div className="skeleton h-4 w-24" />
        <div className="skeleton h-10 w-44" />
        <div className="skeleton h-4 w-32" />
      </div>
      <div aria-hidden="true" className="card card-body space-y-4 lg:col-span-2">
        <div className="skeleton h-4 w-28" />
        <div className="skeleton h-40" />
      </div>
      <div aria-hidden="true" className="card card-body space-y-3 lg:col-span-3">
        <div className="skeleton h-4 w-32" />
        <div className="skeleton h-8" />
        <div className="skeleton h-8" />
        <div className="skeleton h-8" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const visible = usePageVisible();
  const state = useLiveData(fetchDashboard, {
    intervalMs: POLL_INTERVAL_MS,
    enabled: visible,
    merge: mergeDashboard,
  });
  const { visibility, setWidgetVisible } = useWidgetPreferences();
  const noneVisible = !visibility.sales && !visibility.activeUsers && !visibility.recentOrders;

  return (
    <div className="page">
      <header className="page-header">
        <div className="min-w-0 flex-1 basis-80">
          <p className="page-eyebrow">Question 4</p>
          <h1 className="page-title">Live dashboard</h1>
          <p className="page-description">
            Sales, active users and the latest orders, refreshed every 5 seconds while this tab is
            visible.
          </p>
        </div>
        <div className="flex flex-col gap-3 lg:items-end">
          {state.kind === 'ready' && (
            <LiveStatus updatedAt={state.data.generatedAt} error={state.error} paused={!visible} />
          )}
          <WidgetToggles visibility={visibility} onChange={setWidgetVisible} />
        </div>
      </header>

      {state.kind === 'loading' && <DashboardSkeleton />}
      {state.kind === 'error' && (
        <p role="alert" className="alert alert-danger">
          Couldn&apos;t load the dashboard: {state.message}. Retrying automatically.
        </p>
      )}
      {state.kind === 'ready' && noneVisible && (
        <p className="empty-state">All widgets are hidden. Turn one back on above.</p>
      )}
      {state.kind === 'ready' && !noneVisible && (
        <div className="grid gap-4 lg:grid-cols-3">
          {visibility.sales && (
            <SalesWidget
              sales={state.data.sales}
              className={visibility.activeUsers ? undefined : 'lg:col-span-3'}
            />
          )}
          {visibility.activeUsers && (
            <ActiveUsersWidget
              activeUsers={state.data.activeUsers}
              className={visibility.sales ? 'lg:col-span-2' : 'lg:col-span-3'}
            />
          )}
          {visibility.recentOrders && (
            <RecentOrdersWidget orders={state.data.recentOrders} className="lg:col-span-3" />
          )}
        </div>
      )}
    </div>
  );
}
