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
    <div className="page">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">Question 1</p>
          <h1 className="page-title">Shopping cart</h1>
          <p className="page-description">
            Add products, adjust quantities up to what is in stock, and see subtotal, 18% tax and
            total update instantly. Your cart is saved in this browser.
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start xl:gap-8">
        <section aria-labelledby="products-heading">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 id="products-heading" className="section-title">
              Products
            </h2>
            {state.kind === 'success' && state.products.length > 0 && (
              <span className="badge badge-neutral">{state.products.length} products</span>
            )}
          </div>
          <ProductList
            state={state}
            onRetry={retry}
            quantities={cart.quantities}
            onAdd={cart.add}
          />
        </section>
        <div className="lg:sticky lg:top-10">
          <Cart lines={cart.lines} onQuantityChange={cart.setQuantity} onRemove={cart.remove} />
        </div>
      </div>
    </div>
  );
}
