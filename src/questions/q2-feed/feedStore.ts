import { fetchPostsPage } from './api/posts';
import type { Post, PostsPage } from './types';

export type FeedStatus =
  { kind: 'idle' } | { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'end' };

export interface FeedState {
  posts: Post[];
  /** `skip` of the next page to request; only advances when a page succeeds. */
  nextSkip: number;
  status: FeedStatus;
}

export type FetchPage = (skip: number, signal: AbortSignal) => Promise<PostsPage>;

export interface FeedStore {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => FeedState;
  loadMore: () => void;
  /** Re-requests the page that failed; earlier pages are kept. */
  retry: () => void;
  /** Aborts the in-flight page request, if any. */
  abort: () => void;
}

/** Appends `incoming`, skipping any post already shown (pages can overlap if the data shifts). */
export function mergePosts(existing: Post[], incoming: Post[]): Post[] {
  const seen = new Set(existing.map((post) => post.id));
  const fresh = incoming.filter((post) => {
    if (seen.has(post.id)) return false;
    seen.add(post.id);
    return true;
  });
  return fresh.length === 0 ? existing : [...existing, ...fresh];
}

const initialState: FeedState = { posts: [], nextSkip: 0, status: { kind: 'idle' } };

/**
 * Holds the loaded pages outside any component, so the list can unmount (e.g. while a post's
 * detail page is open) and render the same posts synchronously when it comes back.
 */
export function createFeedStore(fetchPage: FetchPage = fetchPostsPage): FeedStore {
  let state = initialState;
  let controller: AbortController | null = null;
  const listeners = new Set<() => void>();

  function setState(next: FeedState) {
    state = next;
    listeners.forEach((listener) => listener());
  }

  async function requestNextPage() {
    // A page is already on its way: never ask for the same page twice.
    if (controller) return;
    const request = new AbortController();
    controller = request;
    setState({ ...state, status: { kind: 'loading' } });
    try {
      const page = await fetchPage(state.nextSkip, request.signal);
      if (request.signal.aborted) return;
      const nextSkip = page.skip + page.posts.length;
      const reachedEnd = page.posts.length === 0 || nextSkip >= page.total;
      setState({
        posts: mergePosts(state.posts, page.posts),
        nextSkip,
        status: reachedEnd ? { kind: 'end' } : { kind: 'idle' },
      });
    } catch (error) {
      if (request.signal.aborted) return;
      const message = error instanceof Error ? error.message : 'Something went wrong';
      setState({ ...state, status: { kind: 'error', message } });
    } finally {
      if (controller === request) controller = null;
    }
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => state,
    loadMore() {
      if (state.status.kind === 'idle') void requestNextPage();
    },
    retry() {
      if (state.status.kind === 'error') void requestNextPage();
    },
    abort() {
      if (!controller) return;
      controller.abort();
      controller = null;
      if (state.status.kind === 'loading') setState({ ...state, status: { kind: 'idle' } });
    },
  };
}
