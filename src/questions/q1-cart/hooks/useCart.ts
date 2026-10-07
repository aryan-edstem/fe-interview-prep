import { useCallback, useMemo, useReducer } from 'react';
import type { CartLine, Product } from '../types';

export interface CartState {
  /** One line per product id, in the order they were added. */
  lines: CartLine[];
}

export type CartAction =
  | { type: 'add'; product: Product }
  | { type: 'setQuantity'; id: number; quantity: number }
  | { type: 'remove'; id: number };

export const emptyCart: CartState = { lines: [] };

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'add': {
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
      const quantity = Math.max(1, Math.floor(action.quantity));
      return {
        lines: state.lines.map((line) => (line.id === action.id ? { ...line, quantity } : line)),
      };
    }
    case 'remove':
      return { lines: state.lines.filter((line) => line.id !== action.id) };
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

  const quantities = useMemo(
    () => new Map(state.lines.map((line) => [line.id, line.quantity])),
    [state.lines],
  );

  return { lines: state.lines, quantities, add, setQuantity, remove };
}
