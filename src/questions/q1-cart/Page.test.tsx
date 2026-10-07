import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { renderRoute } from '@/test/renderRoute';
import { server } from '@/test/setup';
import { CART_STORAGE_KEY } from './storage';

const PRODUCTS_ENDPOINT = 'https://dummyjson.com/products';

const fixture = [
  { id: 1, title: 'Mascara', price: 9.99, thumbnail: 'https://img.test/1.webp', stock: 3 },
  { id: 2, title: 'Palette', price: 19.99, thumbnail: 'https://img.test/2.webp', stock: 10 },
  { id: 3, title: 'Lipstick', price: 4.5, thumbnail: 'https://img.test/3.webp', stock: 0 },
];

function mockProducts(products: unknown[] = fixture) {
  server.use(
    http.get(PRODUCTS_ENDPOINT, () =>
      HttpResponse.json({ products, total: products.length, skip: 0, limit: 30 }),
    ),
  );
}

async function renderCart() {
  const utils = renderRoute('/cart');
  await screen.findByRole('heading', { name: 'Products' });
  await screen.findByRole('button', { name: /: Mascara$/ });
  return utils;
}

function totalsRow(label: RegExp) {
  const totals = screen.getByRole('status', { name: 'Cart totals' });
  const term = within(totals).getByText(label);
  const row = term.parentElement;
  if (!row) throw new Error(`No row for ${label}`);
  return row;
}

function expectTotals(subtotal: string, tax: string, total: string) {
  expect(totalsRow(/^Subtotal/)).toHaveTextContent(subtotal);
  expect(totalsRow(/^Tax \(18%\)/)).toHaveTextContent(tax);
  expect(totalsRow(/^Total$/)).toHaveTextContent(total);
}

const cart = () => within(screen.getByRole('region', { name: 'Cart' }));

beforeEach(() => {
  window.localStorage.clear();
});

describe('Shopping cart page', () => {
  it('shows products with price and stock, and an empty cart', async () => {
    mockProducts();
    await renderCart();

    expect(screen.getByRole('img', { name: 'Palette' })).toBeInTheDocument();
    expect(screen.getByText('$19.99')).toBeInTheDocument();
    expect(screen.getByText('10 in stock')).toBeInTheDocument();
    expect(cart().getByText('Your cart is empty')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Out of stock: Lipstick' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('updates subtotal, tax and total immediately when quantities change', async () => {
    mockProducts();
    const { user } = await renderCart();

    await user.click(screen.getByRole('button', { name: 'Add to cart: Mascara' }));
    expectTotals('$9.99', '$1.80', '$11.79');

    await user.click(cart().getByRole('button', { name: 'Increase quantity of Mascara' }));
    expect(cart().getByRole('status', { name: 'Quantity of Mascara' })).toHaveTextContent('2');
    // 19.98 * 18% = 3.5964 -> 3.60
    expectTotals('$19.98', '$3.60', '$23.58');

    await user.click(screen.getByRole('button', { name: 'Add to cart: Palette' }));
    // 39.97 * 18% = 7.1946 -> 7.19
    expectTotals('$39.97', '$7.19', '$47.16');

    await user.click(cart().getByRole('button', { name: 'Decrease quantity of Mascara' }));
    expectTotals('$29.98', '$5.40', '$35.38');

    await user.click(cart().getByRole('button', { name: 'Remove Palette' }));
    expectTotals('$9.99', '$1.80', '$11.79');

    await user.click(cart().getByRole('button', { name: 'Remove Mascara' }));
    expect(cart().getByText('Your cart is empty')).toBeInTheDocument();
    expectTotals('$0.00', '$0.00', '$0.00');
  });

  it('keeps one totals live region mounted from empty to filled', async () => {
    mockProducts();
    const { user } = await renderCart();

    const totals = screen.getByRole('status', { name: 'Cart totals' });
    expectTotals('$0.00', '$0.00', '$0.00');

    await user.click(screen.getByRole('button', { name: 'Add to cart: Mascara' }));
    expect(screen.getByRole('status', { name: 'Cart totals' })).toBe(totals);
    expect(totals).toHaveAttribute('aria-live', 'polite');
    expectTotals('$9.99', '$1.80', '$11.79');
  });

  it('cannot raise a quantity above the product stock', async () => {
    mockProducts();
    const { user } = await renderCart();

    await user.click(screen.getByRole('button', { name: 'Add to cart: Mascara' }));
    const increase = cart().getByRole('button', { name: 'Increase quantity of Mascara' });
    await user.click(increase);
    await user.click(increase);

    expect(cart().getByRole('status', { name: 'Quantity of Mascara' })).toHaveTextContent('3');
    expect(increase).toHaveAttribute('aria-disabled', 'true');
    expect(increase).toHaveFocus();
    expect(increase).toHaveAccessibleDescription('Max 3 in stock');
    expect(screen.getByRole('button', { name: 'All 3 in cart: Mascara' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expectTotals('$29.97', '$5.39', '$35.36');

    await user.click(increase);
    expect(cart().getByRole('status', { name: 'Quantity of Mascara' })).toHaveTextContent('3');
    expect(cart().getByRole('button', { name: 'Decrease quantity of Mascara' })).toBeEnabled();
  });

  it('keeps focus on the stepper at its limit and moves it sensibly after Remove', async () => {
    mockProducts();
    const { user } = await renderCart();
    await user.click(screen.getByRole('button', { name: 'Add to cart: Mascara' }));
    await user.click(screen.getByRole('button', { name: 'Add to cart: Palette' }));

    const decrease = cart().getByRole('button', { name: 'Decrease quantity of Mascara' });
    expect(decrease).toHaveAttribute('aria-disabled', 'true');
    await user.click(decrease);
    expect(decrease).toHaveFocus();
    expect(cart().getByRole('status', { name: 'Quantity of Mascara' })).toHaveTextContent('1');

    await user.click(cart().getByRole('button', { name: 'Remove Mascara' }));
    expect(cart().getByRole('button', { name: 'Remove Palette' })).toHaveFocus();

    await user.click(cart().getByRole('button', { name: 'Remove Palette' }));
    expect(screen.getByRole('heading', { name: 'Cart' })).toHaveFocus();
  });

  it('keeps the cart across a remount (page refresh)', async () => {
    mockProducts();
    const first = await renderCart();
    await first.user.click(screen.getByRole('button', { name: 'Add to cart: Palette' }));
    await first.user.click(cart().getByRole('button', { name: 'Increase quantity of Palette' }));
    first.unmount();

    // Render the cart before products load: the saved snapshot is enough to show it.
    server.use(http.get(PRODUCTS_ENDPOINT, () => new Promise<never>(() => {})));
    renderRoute('/cart');

    await screen.findByRole('region', { name: 'Cart' });
    expect(cart().getByRole('status', { name: 'Quantity of Palette' })).toHaveTextContent('2');
    expectTotals('$39.98', '$7.20', '$47.18');
  });

  it('ignores corrupt saved data', async () => {
    window.localStorage.setItem(CART_STORAGE_KEY, '{not json');
    mockProducts();
    await renderCart();
    expect(cart().getByText('Your cart is empty')).toBeInTheDocument();
  });

  it('clamps a saved quantity to the latest stock', async () => {
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        lines: [
          { id: 1, title: 'Mascara', priceCents: 999, thumbnail: 'x', stock: 10, quantity: 5 },
        ],
      }),
    );
    mockProducts();
    await renderCart();

    expect(await cart().findByRole('status', { name: 'Quantity of Mascara' })).toHaveTextContent(
      '3',
    );
    expect(cart().getByText('Max 3 in stock')).toBeInTheDocument();
  });

  it('shows an error with a working retry', async () => {
    let calls = 0;
    server.use(
      http.get(PRODUCTS_ENDPOINT, () => {
        calls += 1;
        if (calls === 1) return new HttpResponse(null, { status: 500 });
        return HttpResponse.json({ products: fixture });
      }),
    );
    const { user } = renderRoute('/cart');

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/couldn't load products/i);

    await user.click(within(alert).getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('button', { name: 'Add to cart: Mascara' })).toBeEnabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
