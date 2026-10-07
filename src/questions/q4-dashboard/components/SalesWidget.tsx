import { formatCount, formatCurrency } from '../format';
import type { SalesSummary } from '../types';
import { WidgetCard } from './WidgetCard';

interface SalesWidgetProps {
  sales: SalesSummary;
}

export function SalesWidget({ sales }: SalesWidgetProps) {
  return (
    <WidgetCard title="Sales today">
      <p className="text-3xl font-semibold text-slate-900 tabular-nums">
        {formatCurrency(sales.totalToday)}
      </p>
      <p className="mt-1 text-sm text-slate-600">{formatCount(sales.ordersToday)} orders</p>
    </WidgetCard>
  );
}
