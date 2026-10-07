import { formatCents } from '../money';
import type { Product } from '../types';

export interface ProductCardProps {
  product: Product;
  quantityInCart: number;
  onAdd: (product: Product) => void;
}

export function ProductCard({ product, quantityInCart, onAdd }: ProductCardProps) {
  const outOfStock = product.stock < 1;
  const atMax = !outOfStock && quantityInCart >= product.stock;
  let label = 'Add to cart';
  if (outOfStock) label = 'Out of stock';
  else if (atMax) label = `All ${product.stock} in cart`;
  else if (quantityInCart > 0) label = `Add another (${quantityInCart} in cart)`;

  return (
    <article className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-3">
      <img
        src={product.thumbnail}
        alt={product.title}
        width={160}
        height={160}
        loading="lazy"
        className="mx-auto mb-3 size-32 object-contain"
      />
      <h3 className="text-sm font-medium">{product.title}</h3>
      <p className="mt-1 font-semibold">{formatCents(product.priceCents)}</p>
      <p className="text-xs text-slate-500">
        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
      </p>
      <div className="mt-auto pt-3">
        <button
          type="button"
          onClick={() => onAdd(product)}
          disabled={outOfStock || atMax}
          aria-label={`${label}: ${product.title}`}
          className="w-full rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
        >
          {label}
        </button>
      </div>
    </article>
  );
}
