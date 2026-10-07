import type { ComponentProps } from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderRoute } from '@/test/renderRoute';
import type * as WidgetCardModule from './components/WidgetCard';
import { advance, makeOrder, makeSnapshot, serveDashboard, setTabVisibility } from './testing';

// Every widget renders through WidgetCard, so counting WidgetCard renders per title counts widget
// renders without touching the memo boundary under test.
const renders = vi.hoisted(() => new Map<string, number>());

vi.mock('./components/WidgetCard', async (importOriginal) => {
  const actual = await importOriginal<typeof WidgetCardModule>();
  return {
    WidgetCard: (props: ComponentProps<typeof actual.WidgetCard>) => {
      renders.set(props.title, (renders.get(props.title) ?? 0) + 1);
      return actual.WidgetCard(props);
    },
  };
});

const count = (title: string) => renders.get(title) ?? 0;

describe('Live dashboard re-renders', () => {
  // The route lazy-loads Page; warm the module so the first test isn't racing a cold import.
  beforeAll(async () => {
    await import('./Page');
  });

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    setTabVisibility('visible');
    localStorage.clear();
    renders.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('re-renders only the widgets whose data changed', async () => {
    serveDashboard(
      makeSnapshot({ generatedAt: 1_000, total: 100, users: 120, orders: [makeOrder('ORD-1')] }),
      // Same orders (deep-equal, but a fresh object from the network), new sales and users.
      makeSnapshot({ generatedAt: 2_000, total: 200, users: 140, orders: [makeOrder('ORD-1')] }),
    );
    renderRoute('/dashboard');
    await screen.findByText('$100.00');
    const before = {
      sales: count('Sales today'),
      users: count('Active users'),
      orders: count('Recent orders'),
    };

    await advance(5_000);
    await screen.findByText('$200.00');

    expect(count('Sales today')).toBeGreaterThan(before.sales);
    expect(count('Active users')).toBeGreaterThan(before.users);
    expect(count('Recent orders')).toBe(before.orders);
  });

  it('does not re-render visible widgets when another widget is toggled', async () => {
    serveDashboard(makeSnapshot({ generatedAt: 1_000, total: 100 }));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderRoute('/dashboard');
    await screen.findByText('$100.00');
    const ordersBefore = count('Recent orders');

    await user.click(screen.getByRole('checkbox', { name: 'Sales today' }));

    expect(screen.queryByRole('region', { name: 'Sales today' })).not.toBeInTheDocument();
    expect(count('Recent orders')).toBe(ordersBefore);
  });
});
