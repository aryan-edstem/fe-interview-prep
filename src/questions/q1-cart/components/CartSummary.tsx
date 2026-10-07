import { formatCents, TAX_RATE_PERCENT, type CartTotals } from '../money';

export interface CartSummaryProps {
  totals: CartTotals;
}

export function CartSummary({ totals }: CartSummaryProps) {
  return (
    // Announced politely so screen-reader users hear the new total after each quantity change.
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label="Cart totals"
      className="rounded-b-xl border-t border-slate-200 bg-slate-50 px-4 py-4 text-sm sm:px-5"
    >
      <dl className="space-y-2">
        <div className="flex justify-between text-slate-600">
          <dt>
            Subtotal ({totals.itemCount} {totals.itemCount === 1 ? 'item' : 'items'})
          </dt>
          <dd className="text-slate-900 tabular-nums">{formatCents(totals.subtotalCents)}</dd>
        </div>
        <div className="flex justify-between text-slate-600">
          <dt>Tax ({TAX_RATE_PERCENT}%)</dt>
          <dd className="text-slate-900 tabular-nums">{formatCents(totals.taxCents)}</dd>
        </div>
        <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-semibold">
          <dt>Total</dt>
          <dd className="tabular-nums">{formatCents(totals.totalCents)}</dd>
        </div>
      </dl>
    </div>
  );
}
