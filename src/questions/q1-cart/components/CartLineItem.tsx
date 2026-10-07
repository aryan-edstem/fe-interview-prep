import { formatCents } from '../money';
import type { CartLine } from '../types';

export interface CartLineItemProps {
  line: CartLine;
  onQuantityChange: (id: number, quantity: number) => void;
  onRemove: (id: number) => void;
}

const stepButton =
  'btn btn-ghost btn-icon rounded-none text-base aria-disabled:hover:bg-transparent aria-disabled:hover:text-slate-600';

export function CartLineItem({ line, onQuantityChange, onRemove }: CartLineItemProps) {
  const atMin = line.quantity <= 1;
  const atMax = line.quantity >= line.stock;
  const maxHintId = `cart-line-${line.id}-max`;

  // `aria-disabled` (not `disabled`) keeps focus on a stepper that just hit its limit, so a
  // keyboard user isn't dropped back to <body>. The handlers guard the limit instead.
  const decrease = () => {
    if (!atMin) onQuantityChange(line.id, line.quantity - 1);
  };
  const increase = () => {
    if (!atMax) onQuantityChange(line.id, line.quantity + 1);
  };

  return (
    <li className="flex gap-3 py-4">
      <img
        src={line.thumbnail}
        alt=""
        width={56}
        height={56}
        className="size-14 shrink-0 rounded-lg border border-slate-100 bg-slate-50 object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 text-sm font-medium">{line.title}</p>
          <p className="text-sm font-semibold tabular-nums">
            {formatCents(line.priceCents * line.quantity)}
          </p>
        </div>
        <p className="text-xs text-slate-500">{formatCents(line.priceCents)} each</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="inline-flex items-center overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
            <button
              type="button"
              className={stepButton}
              aria-label={`Decrease quantity of ${line.title}`}
              aria-disabled={atMin}
              onClick={decrease}
            >
              −
            </button>
            <output
              className="w-8 border-x border-slate-200 text-center text-sm leading-8 font-medium tabular-nums"
              aria-label={`Quantity of ${line.title}`}
            >
              {line.quantity}
            </output>
            <button
              type="button"
              className={stepButton}
              aria-label={`Increase quantity of ${line.title}`}
              aria-describedby={atMax ? maxHintId : undefined}
              aria-disabled={atMax}
              onClick={increase}
            >
              +
            </button>
          </div>
          <button
            type="button"
            id={`cart-line-${line.id}-remove`}
            className="btn btn-ghost btn-sm text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            aria-label={`Remove ${line.title}`}
            onClick={() => onRemove(line.id)}
          >
            Remove
          </button>
        </div>
        {atMax && (
          <p className="mt-2">
            <span id={maxHintId} className="badge badge-warning">
              Max {line.stock} in stock
            </span>
          </p>
        )}
      </div>
    </li>
  );
}
