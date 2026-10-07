import type { CartLine } from './types';

export const CART_STORAGE_KEY = 'fe-interview-prep:q1-cart';

interface StoredCart {
  version: 1;
  lines: CartLine[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNonNegativeInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

/** Narrows one stored line; anything malformed or no longer purchasable is dropped. */
function parseLine(raw: unknown): CartLine | null {
  if (!isRecord(raw)) return null;
  const { id, title, priceCents, thumbnail, stock, quantity } = raw;
  if (
    !isNonNegativeInt(id) ||
    typeof title !== 'string' ||
    !isNonNegativeInt(priceCents) ||
    typeof thumbnail !== 'string' ||
    !isNonNegativeInt(stock) ||
    !isNonNegativeInt(quantity) ||
    stock < 1 ||
    quantity < 1
  ) {
    return null;
  }
  return { id, title, priceCents, thumbnail, stock, quantity: Math.min(quantity, stock) };
}

/** Reads the saved cart. Missing, corrupt or inaccessible storage yields an empty cart. */
export function loadCartLines(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== 1 || !Array.isArray(parsed.lines)) return [];
    const seen = new Set<number>();
    const lines: CartLine[] = [];
    for (const candidate of parsed.lines) {
      const line = parseLine(candidate);
      if (line && !seen.has(line.id)) {
        seen.add(line.id);
        lines.push(line);
      }
    }
    return lines;
  } catch {
    return [];
  }
}

/** Saves the cart; quota or privacy-mode errors are ignored so the UI keeps working. */
export function saveCartLines(lines: CartLine[]): void {
  try {
    const data: StoredCart = { version: 1, lines };
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage unavailable: the cart still works for this session.
  }
}
