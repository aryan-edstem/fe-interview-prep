import { useEffect, useRef } from 'react';
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
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  /** Where focus goes once a removed line has left the DOM. */
  const focusAfterRemove = useRef<number | 'heading' | null>(null);

  const handleRemove = (id: number) => {
    const index = lines.findIndex((line) => line.id === id);
    const neighbour = lines[index + 1] ?? lines[index - 1];
    focusAfterRemove.current = neighbour ? neighbour.id : 'heading';
    onRemove(id);
  };

  // Removing the focused line would drop focus to <body>; move it to the next line's Remove
  // button (or the previous one), or to the cart heading when the cart is now empty.
  useEffect(() => {
    const target = focusAfterRemove.current;
    if (target === null) return;
    focusAfterRemove.current = null;
    if (target === 'heading') {
      headingRef.current?.focus();
    } else {
      sectionRef.current?.querySelector<HTMLElement>(`#cart-line-${target}-remove`)?.focus();
    }
  }, [lines]);

  return (
    <section ref={sectionRef} aria-labelledby="cart-heading" className="card">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 sm:px-5">
        <h2 id="cart-heading" ref={headingRef} tabIndex={-1} className="section-title">
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
        <ul className="divide-y divide-slate-100 px-4 sm:px-5">
          {lines.map((line) => (
            <CartLineItem
              key={line.id}
              line={line}
              onQuantityChange={onQuantityChange}
              onRemove={handleRemove}
            />
          ))}
        </ul>
      )}
      {/* Always mounted: a live region only announces changes if it exists before they happen,
          so the first add and the last remove are announced too. */}
      <CartSummary totals={totals} />
    </section>
  );
}
