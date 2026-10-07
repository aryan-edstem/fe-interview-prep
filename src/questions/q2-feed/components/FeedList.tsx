import { useEffect } from 'react';
import { useFeed } from '../hooks/useFeed';
import { useNearBottom } from '../hooks/useNearBottom';
import { PostCard } from './PostCard';

export function FeedList() {
  const { posts, status, loadMore, retry } = useFeed();
  const isEmpty = posts.length === 0;
  const sentinelRef = useNearBottom<HTMLDivElement>(loadMore, { enabled: status.kind === 'idle' });

  // Only the very first visit starts from scratch; coming back from a post keeps what's loaded.
  useEffect(() => {
    if (isEmpty) loadMore();
  }, [isEmpty, loadMore]);

  return (
    <section className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-2xl font-bold">Infinite feed</h1>
      <ul className="grid gap-3">
        {posts.map((post) => (
          <li key={post.id}>
            <PostCard post={post} />
          </li>
        ))}
      </ul>
      <div ref={sentinelRef} aria-hidden="true" className="h-px" />
      <div role="status" aria-live="polite" className="py-6 text-center text-sm text-slate-600">
        {status.kind === 'loading' && (isEmpty ? 'Loading posts...' : 'Loading more posts...')}
        {status.kind === 'end' && (isEmpty ? 'No posts yet.' : "You've reached the end")}
      </div>
      {status.kind === 'error' && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <span>
            {isEmpty ? 'Could not load posts.' : 'Could not load more posts.'} {status.message}
          </span>
          <button
            type="button"
            onClick={retry}
            className="rounded-md bg-red-700 px-3 py-1.5 font-medium text-white hover:bg-red-800"
          >
            Retry
          </button>
        </div>
      )}
    </section>
  );
}
