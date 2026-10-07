import { memo } from 'react';
import { formatCount, formatCurrency } from '../format';
import type { SalesSummary, Slice } from '../types';
import { WidgetCard } from './WidgetCard';

interface SalesWidgetProps {
  sales: Slice<SalesSummary>;
  className?: string;
}

/** Memoized: re-renders only when the sales slice changes reference (see `mergeDashboard`). */
export const SalesWidget = memo(function SalesWidget({ sales, className }: SalesWidgetProps) {
  const { totalToday, ordersToday } = sales.value;
  const averageOrder = ordersToday > 0 ? totalToday / ordersToday : 0;

  return (
    <WidgetCard title="Sales today" updatedAt={sales.updatedAt} className={className}>
      <p className="text-4xl font-bold tracking-tight text-slate-900 tabular-nums">
        {formatCurrency(totalToday)}
      </p>
      <p className="mt-1 text-sm text-slate-500">Gross revenue since midnight</p>
      <dl className="mt-auto grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
        <div>
          <dt className="text-xs text-slate-500">Orders</dt>
          <dd className="text-lg font-semibold text-slate-900 tabular-nums">
            {formatCount(ordersToday)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Average order</dt>
          <dd className="text-lg font-semibold text-slate-900 tabular-nums">
            {formatCurrency(averageOrder)}
          </dd>
        </div>
      </dl>
    </WidgetCard>
  );
});
