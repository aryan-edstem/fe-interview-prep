import { formatCurrency, formatTime, toIsoString } from '../format';
import type { Order, OrderStatus } from '../types';
import { WidgetCard } from './WidgetCard';

interface RecentOrdersWidgetProps {
  orders: Order[];
  className?: string;
}

const STATUS_STYLE: Record<OrderStatus, string> = {
  paid: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
  shipped: 'bg-sky-50 text-sky-800 ring-sky-600/20',
  refunded: 'bg-amber-50 text-amber-800 ring-amber-600/20',
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  paid: 'Paid',
  shipped: 'Shipped',
  refunded: 'Refunded',
};

export function RecentOrdersWidget({ orders, className }: RecentOrdersWidgetProps) {
  return (
    <WidgetCard title="Recent orders" className={className}>
      {orders.length === 0 ? (
        <p className="text-sm text-slate-500">No orders yet today.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {orders.map((order) => (
            <li key={order.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{order.customer}</p>
                <p className="text-xs text-slate-500">
                  {order.id} ·{' '}
                  <time dateTime={toIsoString(order.placedAt)}>{formatTime(order.placedAt)}</time>
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLE[order.status]}`}
                >
                  {STATUS_LABEL[order.status]}
                </span>
                <span className="w-20 text-right font-medium text-slate-900 tabular-nums">
                  {formatCurrency(order.amount)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}
