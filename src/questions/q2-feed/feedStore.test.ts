import { createFeedStore, mergePosts } from './feedStore';
import type { Post, PostsPage } from './types';

const post = (id: number): Post => ({
  id,
  title: `Post ${id}`,
  body: '',
  tags: [],
  reactions: { likes: 0, dislikes: 0 },
  views: 0,
  userId: 1,
});

describe('mergePosts', () => {
  it('appends only posts that are not already present', () => {
    const merged = mergePosts([post(1), post(2)], [post(2), post(3), post(3)]);
    expect(merged.map((p) => p.id)).toEqual([1, 2, 3]);
  });
});

describe('createFeedStore', () => {
  it('starts one request for many loadMore calls and drops it once aborted', async () => {
    let resolvePage: (page: PostsPage) => void = () => {};
    const fetchPage = vi.fn(
      () =>
        new Promise<PostsPage>((resolve) => {
          resolvePage = resolve;
        }),
    );
    const store = createFeedStore(fetchPage);

    store.loadMore();
    store.loadMore();
    store.loadMore();
    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot().status.kind).toBe('loading');

    store.abort();
    resolvePage({ posts: [post(1)], total: 1, skip: 0, limit: 1 });
    await Promise.resolve();
    expect(store.getSnapshot()).toMatchObject({ posts: [], status: { kind: 'idle' } });
  });
});
