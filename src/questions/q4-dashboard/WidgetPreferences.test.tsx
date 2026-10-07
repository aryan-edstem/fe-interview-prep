import { screen } from '@testing-library/react';
import { renderRoute } from '@/test/renderRoute';
import { WIDGET_STORAGE_KEY } from './hooks/useWidgetPreferences';
import { makeSnapshot, serveDashboard } from './testing';

describe('Live dashboard widget preferences', () => {
  // The route lazy-loads Page; warm the module so the first test isn't racing a cold import.
  beforeAll(async () => {
    await import('./Page');
  });

  beforeEach(() => {
    localStorage.clear();
    serveDashboard(makeSnapshot({ generatedAt: 1_000, total: 100 }));
  });

  it('hides a widget and remembers the choice after a reload', async () => {
    const first = renderRoute('/dashboard');
    await screen.findByText('$100.00');

    const toggle = screen.getByRole('checkbox', { name: 'Recent orders' });
    expect(toggle).toBeChecked();
    await first.user.click(toggle);

    expect(toggle).not.toBeChecked();
    expect(screen.queryByRole('region', { name: 'Recent orders' })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Sales today' })).toBeInTheDocument();

    first.unmount();
    renderRoute('/dashboard');
    await screen.findByText('$100.00');

    expect(screen.getByRole('checkbox', { name: 'Recent orders' })).not.toBeChecked();
    expect(screen.queryByRole('region', { name: 'Recent orders' })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Active users' })).toBeInTheDocument();
  });

  it('shows an empty state when every widget is hidden', async () => {
    localStorage.setItem(
      WIDGET_STORAGE_KEY,
      JSON.stringify({ sales: false, activeUsers: false, recentOrders: false }),
    );
    renderRoute('/dashboard');

    expect(await screen.findByText(/All widgets are hidden/)).toBeInTheDocument();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('falls back to showing every widget when the saved value is corrupt', async () => {
    localStorage.setItem(WIDGET_STORAGE_KEY, '{not json');
    renderRoute('/dashboard');
    await screen.findByText('$100.00');

    expect(screen.getAllByRole('region')).toHaveLength(3);
  });
});
