// All cart arithmetic happens in integer cents; floats only appear at the API boundary
// (`toCents`) and in display (`formatCents`). This keeps e.g. 0.1 + 0.2 from drifting.

export const TAX_RATE_PERCENT = 18;

/** Converts a decimal amount (e.g. 9.99) to integer cents (999). */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/** 18% tax on an integer-cent amount, rounded half-up to the nearest cent. */
export function taxCents(subtotalCents: number): number {
  return Math.round((subtotalCents * TAX_RATE_PERCENT) / 100);
}

export interface CartTotals {
  itemCount: number;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
}

/** Derives every total from the lines, so nothing is stored that could drift. */
export function computeTotals(
  lines: readonly { priceCents: number; quantity: number }[],
): CartTotals {
  let itemCount = 0;
  let subtotalCents = 0;
  for (const line of lines) {
    itemCount += line.quantity;
    subtotalCents += line.priceCents * line.quantity;
  }
  const tax = taxCents(subtotalCents);
  return { itemCount, subtotalCents, taxCents: tax, totalCents: subtotalCents + tax };
}

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formats integer cents as currency, always with 2 decimals (e.g. 1999 -> "$19.99"). */
export function formatCents(cents: number): string {
  return currency.format(cents / 100);
}
