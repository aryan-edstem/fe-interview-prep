import { toCents } from '../money';
import type { Product } from '../types';

export const PRODUCTS_URL =
  'https://dummyjson.com/products?limit=30&select=title,price,thumbnail,stock';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Narrows one raw API product, or returns null if it is malformed. */
export function parseProduct(raw: unknown): Product | null {
  if (!isRecord(raw)) return null;
  const { id, title, price, thumbnail, stock } = raw;
  if (
    typeof id !== 'number' ||
    typeof title !== 'string' ||
    typeof price !== 'number' ||
    typeof thumbnail !== 'string' ||
    typeof stock !== 'number'
  ) {
    return null;
  }
  return {
    id,
    title,
    priceCents: toCents(price),
    thumbnail,
    stock: Math.max(0, Math.floor(stock)),
  };
}

export async function fetchProducts(signal?: AbortSignal): Promise<Product[]> {
  const res = await fetch(PRODUCTS_URL, { signal });
  if (!res.ok) throw new Error(`Products request failed (${res.status})`);
  const body: unknown = await res.json();
  if (!isRecord(body) || !Array.isArray(body.products)) {
    throw new Error('Unexpected products response');
  }
  return body.products.map(parseProduct).filter((p): p is Product => p !== null);
}
