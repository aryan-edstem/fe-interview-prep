import { formatCents } from '../money';
import type { CartLine } from '../types';

export interface CartLineItemProps {
  line: CartLine;
  onQuantityChange: (id: number, quantity: number) => void;
  onRemove: (id: number) => void;
}

const stepButton =
  'flex size-7 items-center justify-center rounded-md border border-slate-300 text-sm hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40';

export function CartLineItem({ line, onQuantityChange, onRemove }: CartLineItemProps) {
  return (
    <li className="flex gap-3 py-3">
      <img
        src={line.thumbnail}
        alt=""
        width={48}
        height={48}
        className="size-12 shrink-0 rounded object-contain"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{line.title}</p>
        <p className="text-xs text-slate-500">{formatCents(line.priceCents)} each</p>
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            className={stepButton}
            aria-label={`Decrease quantity of ${line.title}`}
            disabled={line.quantity <= 1}
            onClick={() => onQuantityChange(line.id, line.quantity - 1)}
          >
            −
          </button>
          <output
            className="w-6 text-center text-sm tabular-nums"
            aria-label={`Quantity of ${line.title}`}
          >
            {line.quantity}
          </output>
          <button
            type="button"
            className={stepButton}
            aria-label={`Increase quantity of ${line.title}`}
            onClick={() => onQuantityChange(line.id, line.quantity + 1)}
          >
            +
          </button>
          <button
            type="button"
            className="ml-auto text-xs text-red-700 hover:underline"
            aria-label={`Remove ${line.title}`}
            onClick={() => onRemove(line.id)}
          >
            Remove
          </button>
        </div>
      </div>
      <p className="text-sm font-semibold tabular-nums">
        {formatCents(line.priceCents * line.quantity)}
      </p>
    </li>
  );
}
