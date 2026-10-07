import { formatCents } from '../money';
import type { Product } from '../types';

export interface ProductCardProps {
  product: Product;
  quantityInCart: number;
  onAdd: (product: Product) => void;
}

/** At or below this many units a product is flagged as low stock. */
const LOW_STOCK = 5;

function StockBadge({ stock }: { stock: number }) {
  if (stock < 1) return <span className="badge badge-danger">Out of stock</span>;
  if (stock <= LOW_STOCK) return <span className="badge badge-warning">Only {stock} left</span>;
  return <span className="badge badge-success">{stock} in stock</span>;
}

export function ProductCard({ product, quantityInCart, onAdd }: ProductCardProps) {
  const outOfStock = product.stock < 1;
  const atMax = !outOfStock && quantityInCart >= product.stock;
  let label = 'Add to cart';
  if (outOfStock) label = 'Out of stock';
  else if (atMax) label = `All ${product.stock} in cart`;
  else if (quantityInCart > 0) label = 'Add one more';
  const unavailable = outOfStock || atMax;

  return (
    <article className="card flex h-full flex-col overflow-hidden">
      <div className="aspect-square border-b border-slate-100 bg-slate-50">
        <img
          src={product.thumbnail}
          alt={product.title}
          width={300}
          height={300}
          loading="lazy"
          className="size-full object-cover"
        />
      </div>
      <div className="card-body flex flex-1 flex-col gap-2">
        <h3 className="line-clamp-2 text-sm font-medium">{product.title}</h3>
        <p className="text-lg font-semibold tabular-nums">{formatCents(product.priceCents)}</p>
        <div className="flex flex-wrap gap-1.5">
          <StockBadge stock={product.stock} />
          {quantityInCart > 0 && (
            <span className="badge badge-brand">{quantityInCart} in cart</span>
          )}
        </div>
        <div className="mt-auto pt-2">
          <button
            type="button"
            // aria-disabled keeps focus here when the last unit is added; the guard blocks the add.
            onClick={() => {
              if (!unavailable) onAdd(product);
            }}
            aria-disabled={unavailable}
            aria-label={`${label}: ${product.title}`}
            className={`btn btn-sm w-full ${quantityInCart > 0 ? 'btn-secondary' : 'btn-primary'}`}
          >
            {label}
          </button>
        </div>
      </div>
    </article>
  );
}
