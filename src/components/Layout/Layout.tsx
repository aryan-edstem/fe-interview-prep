import { Suspense } from 'react';
import { Link, NavLink, Outlet, ScrollRestoration } from 'react-router';
import { questions } from '@/questions/registry';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `group flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-brand-50 text-brand-700'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`;

const numberClass = ({ isActive }: { isActive: boolean }) =>
  `flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${
    isActive ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
  }`;

function PageFallback() {
  return (
    <div role="status" className="page space-y-4" aria-label="Loading page">
      <div className="skeleton h-8 w-64" />
      <div className="skeleton h-4 w-96 max-w-full" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="skeleton h-40" />
        <div className="skeleton h-40" />
        <div className="skeleton h-40" />
      </div>
    </div>
  );
}

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur md:h-screen md:w-64 md:shrink-0 md:border-r md:border-b-0">
        <div className="flex h-full flex-col gap-4 p-4 md:p-5">
          <Link to="/" className="flex items-center gap-2.5 rounded-lg">
            <span
              aria-hidden="true"
              className="flex size-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white shadow-sm"
            >
              FE
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold text-slate-900">FE Interview Prep</span>
              <span className="block text-xs text-slate-500">React + TypeScript</span>
            </span>
          </Link>
          <nav aria-label="Questions">
            <p className="mb-2 hidden px-3 text-xs font-semibold tracking-wider text-slate-400 uppercase md:block">
              Questions
            </p>
            <ul className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 md:mx-0 md:flex-col md:overflow-visible md:px-0 md:pb-0">
              {questions.map((q) => (
                <li key={q.slug}>
                  <NavLink to={`/${q.slug}`} className={navLinkClass}>
                    {({ isActive }) => (
                      <>
                        <span className={numberClass({ isActive })}>{q.order}</span>
                        <span className="whitespace-nowrap">{q.title}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <p className="mt-auto hidden px-3 text-xs text-slate-400 md:block">
            Each question ships as its own pull request.
          </p>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <ScrollRestoration />
    </div>
  );
}
