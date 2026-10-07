import type { ProductsState } from '../hooks/useProducts';
import type { Product } from '../types';
import { ProductCard } from './ProductCard';

export interface ProductListProps {
  state: ProductsState;
  onRetry: () => void;
  quantities: ReadonlyMap<number, number>;
  onAdd: (product: Product) => void;
}

const grid = 'grid grid-cols-[repeat(auto-fill,minmax(10.5rem,1fr))] gap-4';
const SKELETON_COUNT = 6;

export function ProductList({ state, onRetry, quantities, onAdd }: ProductListProps) {
  if (state.kind === 'loading') {
    return (
      <div role="status" aria-label="Loading products">
        <span className="sr-only">Loading products...</span>
        <ul className={grid} aria-hidden="true">
          {Array.from({ length: SKELETON_COUNT }, (_, i) => (
            // Static placeholders that never reorder, so the index is a stable key.
            <li key={i} className="card overflow-hidden">
              <div className="skeleton aspect-square rounded-none" />
              <div className="card-body space-y-2">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-4 w-1/2" />
                <div className="skeleton mt-4 h-8 w-full" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (state.kind === 'error') {
    return (
      <div role="alert" className="alert alert-danger">
        <p>Couldn't load products: {state.message}</p>
        <button type="button" onClick={onRetry} className="btn btn-secondary btn-sm">
          Retry
        </button>
      </div>
    );
  }

  if (state.products.length === 0) {
    return <p className="empty-state">No products available right now.</p>;
  }

  return (
    <ul className={grid}>
      {state.products.map((product) => (
        <li key={product.id}>
          <ProductCard
            product={product}
            quantityInCart={quantities.get(product.id) ?? 0}
            onAdd={onAdd}
          />
        </li>
      ))}
    </ul>
  );
}
