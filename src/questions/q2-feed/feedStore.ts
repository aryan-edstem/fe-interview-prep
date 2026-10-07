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
  /** Aborts the in-flight page request, if any. */
  abort: () => void;
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
    const request = new AbortController();
    controller = request;
    setState({ ...state, status: { kind: 'loading' } });
    try {
      const page = await fetchPage(state.nextSkip, request.signal);
      if (request.signal.aborted) return;
      setState({
        posts: [...state.posts, ...page.posts],
        nextSkip: page.skip + page.posts.length,
        status: { kind: 'idle' },
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
    abort() {
      if (!controller) return;
      controller.abort();
      controller = null;
      if (state.status.kind === 'loading') setState({ ...state, status: { kind: 'idle' } });
    },
  };
}
