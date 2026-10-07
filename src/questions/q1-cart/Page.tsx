import { ProductList } from './components/ProductList';
import { useProducts } from './hooks/useProducts';

export default function CartPage() {
  const { state, retry } = useProducts();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Shopping cart</h1>
      <section aria-labelledby="products-heading">
        <h2 id="products-heading" className="mb-3 text-lg font-semibold">
          Products
        </h2>
        <ProductList state={state} onRetry={retry} />
      </section>
    </div>
  );
}
