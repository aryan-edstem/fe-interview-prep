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
  return (
    <WidgetCard title="Sales today" updatedAt={sales.updatedAt} className={className}>
      <p className="text-3xl font-semibold text-slate-900 tabular-nums">
        {formatCurrency(sales.value.totalToday)}
      </p>
      <p className="mt-1 text-sm text-slate-600">{formatCount(sales.value.ordersToday)} orders</p>
    </WidgetCard>
  );
});
