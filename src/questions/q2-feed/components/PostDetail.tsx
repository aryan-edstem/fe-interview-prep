import type { MouseEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { usePost } from '../hooks/usePost';

function hasFeedOrigin(state: unknown): boolean {
  return typeof state === 'object' && state !== null && 'fromFeed' in state;
}

function BackToFeed() {
  const location = useLocation();
  const navigate = useNavigate();
  const cameFromFeed = hasFeedOrigin(location.state);

  // Going *back* (not pushing /feed) lets the router restore the feed's scroll position.
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!cameFromFeed) return;
    event.preventDefault();
    void navigate(-1);
  }

  return (
    <Link to=".." onClick={handleClick} className="mb-4 inline-block text-blue-700 underline">
      Back to feed
    </Link>
  );
}

export function PostDetail() {
  const { postId } = useParams();
  const { state, retry } = usePost(Number(postId));

  return (
    <section className="mx-auto max-w-2xl">
      <BackToFeed />
      {state.kind === 'loading' && (
        <p role="status" className="text-slate-600">
          Loading post...
        </p>
      )}
      {state.kind === 'not-found' && <h1 className="text-2xl font-bold">Post not found</h1>}
      {state.kind === 'error' && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <p className="mb-2">Could not load this post. {state.message}</p>
          <button
            type="button"
            onClick={retry}
            className="rounded-md bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-800"
          >
            Retry
          </button>
        </div>
      )}
      {state.kind === 'ready' && (
        <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="mb-3 text-2xl font-bold">{state.post.title}</h1>
          <p className="mb-4 leading-relaxed text-slate-700">{state.post.body}</p>
          <ul className="mb-4 flex flex-wrap gap-2 text-xs" aria-label="Tags">
            {state.post.tags.map((tag) => (
              <li key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
                #{tag}
              </li>
            ))}
          </ul>
          <p className="text-sm text-slate-500">
            {state.post.reactions.likes} likes · {state.post.reactions.dislikes} dislikes ·{' '}
            {state.post.views} views
          </p>
        </article>
      )}
    </section>
  );
}
