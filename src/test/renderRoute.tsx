import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from '@/app/routes';

/** Renders the real route tree at `path`, so tests exercise routing the way users hit it. */
export function renderRoute(path = '/') {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return { user: userEvent.setup(), router, ...render(<RouterProvider router={router} />) };
}
