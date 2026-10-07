import { Link } from 'react-router';
import { questions } from '@/questions/registry';

const STACK = ['React 19', 'TypeScript', 'Vite', 'Tailwind CSS', 'React Router', 'Vitest'];

export function HomePage() {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">Frontend exercises</p>
          <h1 className="page-title">FE Interview Prep</h1>
          <p className="page-description">
            React + TypeScript exercises. Each question lives on its own route, with its own state,
            tests and pull request.
          </p>
        </div>
        <ul aria-label="Tech stack" className="flex flex-wrap gap-1.5">
          {STACK.map((tech) => (
            <li key={tech} className="badge badge-neutral">
              {tech}
            </li>
          ))}
        </ul>
      </header>

      {questions.length === 0 ? (
        <p className="empty-state">No questions yet.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {questions.map((q) => (
            <li key={q.slug}>
              <Link
                to={`/${q.slug}`}
                className="card card-interactive group flex h-full flex-col gap-3 p-5"
              >
                <span className="flex items-center justify-between">
                  <span className="badge badge-brand">Question {q.order}</span>
                  <span
                    aria-hidden="true"
                    className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600"
                  >
                    &rarr;
                  </span>
                </span>
                <span className="text-lg font-semibold text-slate-900">{q.title}</span>
                <span className="text-sm text-slate-600">{q.summary}</span>
                {q.tags && q.tags.length > 0 && (
                  <span className="mt-auto flex flex-wrap gap-1.5 pt-2">
                    {q.tags.map((tag) => (
                      <span key={tag} className="badge badge-neutral">
                        {tag}
                      </span>
                    ))}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
