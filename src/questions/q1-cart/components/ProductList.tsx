import type { ProductsState } from '../hooks/useProducts';
import type { Product } from '../types';
import { ProductCard } from './ProductCard';

export interface ProductListProps {
  state: ProductsState;
  onRetry: () => void;
  quantities: ReadonlyMap<number, number>;
  onAdd: (product: Product) => void;
}

export function ProductList({ state, onRetry, quantities, onAdd }: ProductListProps) {
  if (state.kind === 'loading') {
    return (
      <p role="status" className="text-slate-600">
        Loading products...
      </p>
    );
  }

  if (state.kind === 'error') {
    return (
      <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        <p className="mb-3">Couldn't load products: {state.message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-800"
        >
          Retry
        </button>
      </div>
    );
  }

  if (state.products.length === 0) {
    return <p className="text-slate-600">No products available.</p>;
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
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
