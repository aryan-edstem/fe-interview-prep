import { useCallback, useMemo, useReducer } from 'react';
import type { CartLine, Product } from '../types';

export interface CartState {
  /** One line per product id, in the order they were added. */
  lines: CartLine[];
}

export type CartAction =
  | { type: 'add'; product: Product }
  | { type: 'setQuantity'; id: number; quantity: number }
  | { type: 'remove'; id: number }
  | { type: 'reconcile'; products: readonly Product[] };

export const emptyCart: CartState = { lines: [] };

/** A line's quantity always stays within 1..stock. */
export function clampQuantity(quantity: number, stock: number): number {
  return Math.min(Math.max(1, Math.floor(quantity)), stock);
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'add': {
      if (action.product.stock < 1) return state;
      const existing = state.lines.find((line) => line.id === action.product.id);
      if (existing) {
        return cartReducer(state, {
          type: 'setQuantity',
          id: existing.id,
          quantity: existing.quantity + 1,
        });
      }
      return { lines: [...state.lines, { ...action.product, quantity: 1 }] };
    }
    case 'setQuantity': {
      const line = state.lines.find((l) => l.id === action.id);
      if (!line) return state;
      const quantity = clampQuantity(action.quantity, line.stock);
      if (quantity === line.quantity) return state;
      return {
        lines: state.lines.map((l) => (l.id === action.id ? { ...l, quantity } : l)),
      };
    }
    case 'remove':
      return { lines: state.lines.filter((line) => line.id !== action.id) };
    case 'reconcile': {
      // Stored lines may hold a stale price/stock: refresh them from the latest fetch, clamp
      // quantities to the new stock and drop lines that sold out.
      const fresh = new Map(action.products.map((p) => [p.id, p]));
      let changed = false;
      const lines: CartLine[] = [];
      for (const line of state.lines) {
        const product = fresh.get(line.id);
        if (!product) {
          lines.push(line);
          continue;
        }
        if (product.stock < 1) {
          changed = true;
          continue;
        }
        const quantity = clampQuantity(line.quantity, product.stock);
        if (
          quantity !== line.quantity ||
          product.stock !== line.stock ||
          product.priceCents !== line.priceCents ||
          product.title !== line.title ||
          product.thumbnail !== line.thumbnail
        ) {
          changed = true;
          lines.push({ ...product, quantity });
        } else {
          lines.push(line);
        }
      }
      return changed ? { lines } : state;
    }
  }
}

export function useCart() {
  const [state, dispatch] = useReducer(cartReducer, emptyCart);

  const add = useCallback((product: Product) => dispatch({ type: 'add', product }), []);
  const setQuantity = useCallback(
    (id: number, quantity: number) => dispatch({ type: 'setQuantity', id, quantity }),
    [],
  );
  const remove = useCallback((id: number) => dispatch({ type: 'remove', id }), []);
  const reconcile = useCallback(
    (products: readonly Product[]) => dispatch({ type: 'reconcile', products }),
    [],
  );

  const quantities = useMemo(
    () => new Map(state.lines.map((line) => [line.id, line.quantity])),
    [state.lines],
  );

  return { lines: state.lines, quantities, add, setQuantity, remove, reconcile };
}
