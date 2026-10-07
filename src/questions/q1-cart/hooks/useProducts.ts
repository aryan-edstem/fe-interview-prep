import { useCallback, useEffect, useState } from 'react';
import { fetchProducts } from '../api/products';
import type { Product } from '../types';

export type ProductsState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'success'; products: Product[] };

/** Loads the product list; aborts on unmount and exposes `retry` for the error state. */
export function useProducts() {
  const [state, setState] = useState<ProductsState>({ kind: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchProducts(controller.signal).then(
      (products) => {
        if (!controller.signal.aborted) setState({ kind: 'success', products });
      },
      (error: unknown) => {
        // An aborted request belongs to an unmounted or superseded load: ignore it.
        if (controller.signal.aborted) return;
        setState({
          kind: 'error',
          message: error instanceof Error ? error.message : 'Something went wrong',
        });
      },
    );
    return () => controller.abort();
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ kind: 'loading' });
    setAttempt((n) => n + 1);
  }, []);

  return { state, retry };
}
