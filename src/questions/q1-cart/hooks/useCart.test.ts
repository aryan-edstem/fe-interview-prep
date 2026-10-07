import { cartReducer, emptyCart } from './useCart';
import type { Product } from '../types';

const mascara: Product = { id: 1, title: 'Mascara', priceCents: 999, thumbnail: 'x', stock: 2 };

describe('cartReducer', () => {
  it('adds a product once, then increments it up to stock', () => {
    let state = cartReducer(emptyCart, { type: 'add', product: mascara });
    state = cartReducer(state, { type: 'add', product: mascara });
    const atMax = cartReducer(state, { type: 'add', product: mascara });

    expect(state.lines).toHaveLength(1);
    expect(state.lines[0]?.quantity).toBe(2);
    expect(atMax).toBe(state);
  });

  it('clamps quantities to 1..stock', () => {
    const state = cartReducer(emptyCart, { type: 'add', product: mascara });
    expect(
      cartReducer(state, { type: 'setQuantity', id: 1, quantity: 99 }).lines[0]?.quantity,
    ).toBe(2);
    expect(cartReducer(state, { type: 'setQuantity', id: 1, quantity: 0 }).lines[0]?.quantity).toBe(
      1,
    );
  });

  it('never adds an out-of-stock product', () => {
    const state = cartReducer(emptyCart, { type: 'add', product: { ...mascara, stock: 0 } });
    expect(state.lines).toHaveLength(0);
  });

  it('drops lines that sold out and keeps state identity when nothing changed', () => {
    const state = cartReducer(emptyCart, { type: 'add', product: mascara });
    expect(cartReducer(state, { type: 'reconcile', products: [mascara] })).toBe(state);
    expect(
      cartReducer(state, { type: 'reconcile', products: [{ ...mascara, stock: 0 }] }).lines,
    ).toHaveLength(0);
  });
});
