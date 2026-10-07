import { useEffect } from 'react';
import { useFeed } from '../hooks/useFeed';
import { useNearBottom } from '../hooks/useNearBottom';
import { PostCard } from './PostCard';

export function FeedList() {
  const { posts, status, loadMore } = useFeed();
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
      </div>
    </section>
  );
}
