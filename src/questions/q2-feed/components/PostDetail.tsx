import { useRef, type MouseEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { usePost } from '../hooks/usePost';

function hasFeedOrigin(state: unknown): boolean {
  return typeof state === 'object' && state !== null && 'fromFeed' in state;
}

function BackToFeed() {
  const location = useLocation();
  const navigate = useNavigate();
  const cameFromFeed = hasFeedOrigin(location.state);

  // Going *back* (not pushing /feed) lets the router restore the feed's scroll position. Clicks
  // that mean "open elsewhere" (modifier keys, non-primary button) are left to the browser.
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    const opensElsewhere =
      event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
    if (!cameFromFeed || opensElsewhere || event.defaultPrevented) return;
    event.preventDefault();
    void navigate(-1);
  }

  return (
    <Link to=".." onClick={handleClick} className="btn btn-ghost btn-sm mb-4 -ml-2.5">
      <span aria-hidden="true">&larr;</span>
      Back to feed
    </Link>
  );
}

function PostSkeleton() {
  return (
    <div role="status" className="card card-body sm:p-8">
      <span className="sr-only">Loading post...</span>
      <div aria-hidden="true">
        <div className="skeleton mb-3 h-3 w-20" />
        <div className="skeleton mb-6 h-8 w-3/4" />
        <div className="skeleton mb-2 h-4 w-full" />
        <div className="skeleton mb-2 h-4 w-full" />
        <div className="skeleton mb-8 h-4 w-2/3" />
        <div className="flex gap-1.5">
          <div className="skeleton h-5 w-16 rounded-full" />
          <div className="skeleton h-5 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function PostNotFound() {
  return (
    <div className="empty-state">
      <h1 className="text-lg font-semibold">Post not found</h1>
      <p>It may have been removed, or the link is wrong.</p>
    </div>
  );
}

/** `/feed/:postId` only names a post when the segment is a positive whole number. */
function parsePostId(segment: string | undefined): number | null {
  if (!segment || !/^\d+$/.test(segment)) return null;
  const id = Number(segment);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function PostDetail() {
  const id = parsePostId(useParams().postId);

  return (
    <div className="page max-w-3xl">
      <BackToFeed />
      {id === null ? <PostNotFound /> : <PostContent id={id} />}
    </div>
  );
}

function PostContent({ id }: { id: number }) {
  const { state, retry } = usePost(id);
  const regionRef = useRef<HTMLDivElement>(null);

  // Retry swaps the alert for a skeleton; move focus to the region so it isn't lost to <body>.
  function handleRetry() {
    regionRef.current?.focus();
    retry();
  }

  return (
    <div ref={regionRef} tabIndex={-1} className="focus-visible:outline-none">
      {state.kind === 'loading' && <PostSkeleton />}
      {state.kind === 'not-found' && <PostNotFound />}
      {state.kind === 'error' && (
        <div role="alert" className="alert alert-danger">
          <p>
            <span className="font-medium">Could not load this post.</span> {state.message}
          </p>
          <button type="button" onClick={handleRetry} className="btn btn-secondary btn-sm">
            Retry
          </button>
        </div>
      )}
      {state.kind === 'ready' && (
        <article className="card card-body sm:p-8">
          <p className="page-eyebrow">Post #{state.post.id}</p>
          <h1 className="mb-4 text-2xl leading-tight font-bold sm:text-3xl">{state.post.title}</h1>
          <p className="text-base leading-relaxed text-slate-700 sm:text-lg">{state.post.body}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
            <ul aria-label="Tags" className="flex flex-wrap gap-1.5">
              {state.post.tags.map((tag) => (
                <li key={tag} className="badge badge-neutral">
                  #{tag}
                </li>
              ))}
            </ul>
            <ul aria-label="Reactions" className="ml-auto flex flex-wrap gap-1.5">
              <li className="badge badge-success">
                {state.post.reactions.likes.toLocaleString()} likes
              </li>
              <li className="badge badge-danger">
                {state.post.reactions.dislikes.toLocaleString()} dislikes
              </li>
              <li className="badge badge-neutral">{state.post.views.toLocaleString()} views</li>
            </ul>
          </div>
        </article>
      )}
    </div>
  );
}
