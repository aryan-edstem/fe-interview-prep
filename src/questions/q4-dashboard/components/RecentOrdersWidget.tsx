import { memo } from 'react';
import { formatCurrency, formatRelative, formatTime, toIsoString } from '../format';
import { useNow } from '../hooks/useNow';
import type { Order, OrderStatus, Slice } from '../types';
import { WidgetCard } from './WidgetCard';

interface RecentOrdersWidgetProps {
  orders: Slice<Order[]>;
  className?: string;
}

const STATUS_BADGE: Record<OrderStatus, string> = {
  paid: 'badge-success',
  shipped: 'badge-brand',
  refunded: 'badge-warning',
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  paid: 'Paid',
  shipped: 'Shipped',
  refunded: 'Refunded',
};

/** Relative "placed" labels only need minute precision. */
const RELATIVE_TICK_MS = 30_000;

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Memoized: re-renders only when the orders slice changes reference, plus its own clock tick for
 * the relative times.
 */
export const RecentOrdersWidget = memo(function RecentOrdersWidget({
  orders: { value: orders, updatedAt },
  className,
}: RecentOrdersWidgetProps) {
  const now = useNow(RELATIVE_TICK_MS);

  return (
    <WidgetCard title="Recent orders" updatedAt={updatedAt} className={className}>
      {orders.length === 0 ? (
        <p className="empty-state">No orders yet today.</p>
      ) : (
        <div className="-mx-4 overflow-x-auto sm:-mx-5">
          <table className="w-full text-left text-sm">
            <thead className="border-y border-slate-100 bg-slate-50/60 text-xs text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium sm:px-5">
                  Customer
                </th>
                <th scope="col" className="px-2 py-2 font-medium">
                  Status
                </th>
                <th scope="col" className="hidden px-2 py-2 font-medium sm:table-cell">
                  Placed
                </th>
                <th scope="col" className="px-4 py-2 text-right font-medium sm:px-5">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3 sm:px-5">
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700"
                      >
                        {initials(order.customer)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">{order.customer}</p>
                        <p className="text-xs text-slate-500">{order.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <span className={`badge ${STATUS_BADGE[order.status]}`}>
                      {STATUS_LABEL[order.status]}
                    </span>
                  </td>
                  <td className="hidden px-2 py-3 text-slate-500 sm:table-cell">
                    <time dateTime={toIsoString(order.placedAt)} title={formatTime(order.placedAt)}>
                      {formatRelative(order.placedAt, now)}
                    </time>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900 tabular-nums sm:px-5">
                    {formatCurrency(order.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </WidgetCard>
  );
});
