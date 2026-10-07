import { screen } from '@testing-library/react';
import { renderRoute } from '@/test/renderRoute';

describe('app routes', () => {
  it('renders the home page at /', () => {
    renderRoute('/');
    expect(
      screen.getByRole('heading', { level: 1, name: 'FE Interview Prep' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Questions' })).toBeInTheDocument();
  });

  it('shows a not-found page with a way home for unknown routes', async () => {
    const { user, router } = renderRoute('/does-not-exist');
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Back to all questions' }));
    expect(router.state.location.pathname).toBe('/');
  });
});
