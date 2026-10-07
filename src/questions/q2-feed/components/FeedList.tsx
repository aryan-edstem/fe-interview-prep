import { useEffect, useRef } from 'react';
import { useFeed } from '../hooks/useFeed';
import { useNearBottom } from '../hooks/useNearBottom';
import { PostCard, PostCardSkeleton } from './PostCard';

export function FeedList() {
  const { posts, status, loadMore, retry } = useFeed();
  const isEmpty = posts.length === 0;
  const sentinelRef = useNearBottom<HTMLDivElement>(loadMore, { enabled: status.kind === 'idle' });
  const footerRef = useRef<HTMLDivElement>(null);

  // Retry unmounts the alert (and the focused button with it), so keep focus in the footer, where
  // the loading status and any new error are announced.
  function handleRetry() {
    footerRef.current?.focus();
    retry();
  }

  // Only the very first visit starts from scratch; coming back from a post keeps what's loaded.
  useEffect(() => {
    if (isEmpty) loadMore();
  }, [isEmpty, loadMore]);

  return (
    <div className="page max-w-3xl">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">Question 2</p>
          <h1 className="page-title">Infinite feed</h1>
          <p className="page-description">
            Posts load ten at a time as you near the bottom. Open one and come back to pick up where
            you left off.
          </p>
        </div>
        {posts.length > 0 && (
          <p className="badge badge-brand">{posts.length.toLocaleString()} loaded</p>
        )}
      </header>

      <ul className="grid gap-4">
        {posts.map((post) => (
          <li key={post.id}>
            <PostCard post={post} />
          </li>
        ))}
      </ul>

      {status.kind === 'loading' && (
        <div className="mt-4 grid gap-4">
          {Array.from({ length: isEmpty ? 3 : 2 }, (_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      )}

      <div ref={sentinelRef} aria-hidden="true" className="h-px" />

      <div
        ref={footerRef}
        tabIndex={-1}
        role="group"
        aria-label="Feed status"
        className="mt-6 focus-visible:outline-none"
      >
        <div role="status" aria-live="polite">
          {/* Always mounted so the live region only swaps its text. */}
          <span className="sr-only">
            {status.kind === 'loading' && (isEmpty ? 'Loading posts...' : 'Loading more posts...')}
          </span>
          {status.kind === 'end' &&
            (isEmpty ? (
              <p className="empty-state">No posts yet.</p>
            ) : (
              <p className="flex items-center gap-4 py-4 text-sm font-medium text-slate-500">
                <span aria-hidden="true" className="h-px flex-1 bg-slate-200" />
                You&apos;ve reached the end
                <span aria-hidden="true" className="h-px flex-1 bg-slate-200" />
              </p>
            ))}
        </div>
        {status.kind === 'error' && (
          <div role="alert" className="alert alert-danger">
            <p>
              <span className="font-medium">
                {isEmpty ? 'Could not load posts.' : 'Could not load more posts.'}
              </span>{' '}
              {status.message}
            </p>
            <button type="button" onClick={handleRetry} className="btn btn-secondary btn-sm">
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
