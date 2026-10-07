import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <section>
      <h1 className="mb-2 text-2xl font-bold">Page not found</h1>
      <Link to="/" className="text-blue-700 underline">
        Back to all questions
      </Link>
    </section>
  );
}
