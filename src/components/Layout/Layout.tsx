import { Suspense } from 'react';
import { NavLink, Outlet, ScrollRestoration } from 'react-router';
import { questions } from '@/questions/registry';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-md px-3 py-2 text-sm ${
    isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-200'
  }`;

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b border-slate-200 bg-white p-4 md:w-60 md:border-r md:border-b-0">
        <NavLink to="/" className="mb-4 block text-lg font-semibold">
          FE Interview Prep
        </NavLink>
        <nav aria-label="Questions">
          <ul className="space-y-1">
            {questions.map((q) => (
              <li key={q.slug}>
                <NavLink to={`/${q.slug}`} className={linkClass}>
                  Q{q.order}. {q.title}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-6">
        <Suspense fallback={<p role="status">Loading...</p>}>
          <Outlet />
        </Suspense>
      </main>
      <ScrollRestoration />
    </div>
  );
}
