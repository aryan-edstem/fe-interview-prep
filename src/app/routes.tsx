import type { RouteObject } from 'react-router';
import { Layout } from '@/components/Layout/Layout';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { questions } from '@/questions/registry';

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      // `/*` lets a question own sub-routes (e.g. `/feed/:id`) with its own `<Routes>`.
      ...questions.map(({ slug, Page }) => ({ path: `${slug}/*`, element: <Page /> })),
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
