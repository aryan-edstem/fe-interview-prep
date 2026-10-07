import { computeTotals } from '../money';
import type { CartLine } from '../types';
import { CartLineItem } from './CartLineItem';
import { CartSummary } from './CartSummary';

export interface CartProps {
  lines: CartLine[];
  onQuantityChange: (id: number, quantity: number) => void;
  onRemove: (id: number) => void;
}

export function Cart({ lines, onQuantityChange, onRemove }: CartProps) {
  // Derived on every render: cheap for a cart, and it can never drift from the lines.
  const totals = computeTotals(lines);

  return (
    <section
      aria-labelledby="cart-heading"
      className="rounded-lg border border-slate-200 bg-white p-4"
    >
      <h2 id="cart-heading" className="text-lg font-semibold">
        Cart
      </h2>
      <ul className="divide-y divide-slate-100">
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
    </section>
  );
}
