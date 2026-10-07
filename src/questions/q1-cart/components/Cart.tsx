import { computeTotals } from '../money';
import type { CartLine } from '../types';
import { CartLineItem } from './CartLineItem';
import { CartSummary } from './CartSummary';

export interface CartProps {
  lines: CartLine[];
  onQuantityChange: (id: number, quantity: number) => void;
  onRemove: (id: number) => void;
}

function BagIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-10 text-slate-300"
    >
      <path d="M6 7h12l-1 13H7L6 7Z" />
      <path d="M9 7V6a3 3 0 0 1 6 0v1" />
    </svg>
  );
}

export function Cart({ lines, onQuantityChange, onRemove }: CartProps) {
  // Derived on every render: cheap for a cart, and it can never drift from the lines.
  const totals = computeTotals(lines);

  return (
    <section aria-labelledby="cart-heading" className="card">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 sm:px-5">
        <h2 id="cart-heading" className="section-title">
          Cart
        </h2>
        {totals.itemCount > 0 && (
          <span className="badge badge-brand">
            {totals.itemCount} {totals.itemCount === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>
      {lines.length === 0 ? (
        <div className="p-4 sm:p-5">
          <div className="empty-state">
            <BagIcon />
            <p className="text-base font-medium text-slate-900">Your cart is empty</p>
            <p>Add a product to see your totals here.</p>
          </div>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-slate-100 px-4 sm:px-5">
            {lines.map((line) => (
              <CartLineItem
                key={line.id}
                line={line}
                onQuantityChange={onQuantityChange}
                onRemove={onRemove}
              />
            ))}
          </ul>
          <CartSummary totals={totals} />
        </>
      )}
    </section>
  );
}
