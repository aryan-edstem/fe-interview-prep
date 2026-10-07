import { Link } from 'react-router';
import { questions } from '@/questions/registry';

export function HomePage() {
  return (
    <section className="max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold">FE Interview Prep</h1>
      <p className="mb-6 text-slate-600">
        React + TypeScript exercises. Each question lives on its own route.
      </p>
      {questions.length === 0 ? (
        <p className="text-slate-500">No questions yet.</p>
      ) : (
        <ul className="grid gap-3">
          {questions.map((q) => (
            <li key={q.slug}>
              <Link
                to={`/${q.slug}`}
                className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-400"
              >
                <span className="font-medium">
                  Q{q.order}. {q.title}
                </span>
                <span className="block text-sm text-slate-600">{q.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
