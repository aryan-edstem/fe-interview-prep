import { useEffect } from 'react';
import { Cart } from './components/Cart';
import { ProductList } from './components/ProductList';
import { useCart } from './hooks/useCart';
import { useProducts } from './hooks/useProducts';

export default function CartPage() {
  const { state, retry } = useProducts();
  const cart = useCart();
  const { reconcile } = cart;

  // Sync stored cart lines with the freshly fetched stock and prices.
  useEffect(() => {
    if (state.kind === 'success') reconcile(state.products);
  }, [state, reconcile]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Shopping cart</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
        <section aria-labelledby="products-heading">
          <h2 id="products-heading" className="mb-3 text-lg font-semibold">
            Products
          </h2>
          <ProductList
            state={state}
            onRetry={retry}
            quantities={cart.quantities}
            onAdd={cart.add}
          />
        </section>
        <div className="lg:sticky lg:top-6">
          <Cart lines={cart.lines} onQuantityChange={cart.setQuantity} onRemove={cart.remove} />
        </div>
      </div>
    </div>
  );
}
