import { formatCents } from '../money';
import type { Product } from '../types';

export interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
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
    </article>
  );
}
