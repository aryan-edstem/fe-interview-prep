import { computeTotals, formatCents, taxCents, toCents } from './money';

describe('money', () => {
  it('converts decimal prices to integer cents without float drift', () => {
    expect(toCents(9.99)).toBe(999);
    expect(toCents(0.1 + 0.2)).toBe(30);
  });

  it('rounds 18% tax half-up to the nearest cent', () => {
    expect(taxCents(999)).toBe(180); // 179.82 -> 180
    expect(taxCents(25)).toBe(5); // 4.5 -> 5
    expect(taxCents(2)).toBe(0); // 0.36 -> 0
    expect(taxCents(0)).toBe(0);
  });

  it('sums lines in cents where float addition would drift', () => {
    // 0.1 + 0.2 in floats is 0.30000000000000004; in cents it is exactly 30.
    const totals = computeTotals([
      { priceCents: 10, quantity: 1 },
      { priceCents: 20, quantity: 1 },
    ]);
    expect(totals).toEqual({ itemCount: 2, subtotalCents: 30, taxCents: 5, totalCents: 35 });
  });

  it('derives subtotal, tax and total from quantities', () => {
    const totals = computeTotals([
      { priceCents: 999, quantity: 3 },
      { priceCents: 1999, quantity: 2 },
    ]);
    // 29.97 + 39.98 = 69.95; tax 12.591 -> 12.59; total 82.54
    expect(totals).toEqual({
      itemCount: 5,
      subtotalCents: 6995,
      taxCents: 1259,
      totalCents: 8254,
    });
  });

  it('always formats with two decimals', () => {
    expect(formatCents(0)).toBe('$0.00');
    expect(formatCents(1990)).toBe('$19.90');
    expect(formatCents(123456)).toBe('$1,234.56');
  });
});
