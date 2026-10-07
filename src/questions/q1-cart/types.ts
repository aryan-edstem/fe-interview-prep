/** A product as the cart uses it. Prices are integer cents so totals never drift. */
export interface Product {
  id: number;
  title: string;
  priceCents: number;
  thumbnail: string;
  stock: number;
}

/** One cart line: a product snapshot (enough to render after a refresh) plus a quantity. */
export interface CartLine extends Product {
  quantity: number;
}
