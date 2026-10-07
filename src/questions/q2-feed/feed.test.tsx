import { act, screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/setup';
import { renderRoute } from '@/test/renderRoute';
import type { Post } from './types';

const POSTS_URL = 'https://dummyjson.com/posts';
const TOTAL = 25;

const allPosts: Post[] = Array.from({ length: TOTAL }, (_, i) => ({
  id: i + 1,
  title: `Post ${i + 1}`,
  body: `Body of post ${i + 1}`,
  tags: ['test'],
  reactions: { likes: i, dislikes: 0 },
  views: 100 + i,
  userId: 1,
}));

/** Every `skip` the feed requested, in order. */
let requestedSkips: number[] = [];
/** Every post id the detail page requested. */
let requestedPostIds: string[] = [];

function pageResponse(skip: number, limit: number, posts = allPosts.slice(skip, skip + limit)) {
  return HttpResponse.json({ posts, total: TOTAL, skip, limit: posts.length });
}

function mockPostsApi(
  respond: (skip: number, limit: number) => Response = (skip, limit) => pageResponse(skip, limit),
) {
  server.use(
    http.get(POSTS_URL, ({ request }) => {
      const url = new URL(request.url);
      const skip = Number(url.searchParams.get('skip'));
      requestedSkips.push(skip);
      return respond(skip, Number(url.searchParams.get('limit')));
    }),
    http.get(`${POSTS_URL}/:id`, ({ params }) => {
      requestedPostIds.push(String(params.id));
      const post = allPosts.find((p) => p.id === Number(params.id));
      return post ? HttpResponse.json(post) : new HttpResponse(null, { status: 404 });
    }),
  );
}

// jsdom has no IntersectionObserver: keep the live observers so a test can bring the sentinel
// "into view" on demand.
const observers = new Set<MockIntersectionObserver>();

class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin: string;
  readonly thresholds = [0];
  readonly scrollMargin = '0px';
  private readonly callback: IntersectionObserverCallback;
  private targets: Element[] = [];

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    this.rootMargin = options?.rootMargin ?? '0px';
    observers.add(this);
  }

  observe(target: Element) {
    this.targets.push(target);
  }

  unobserve(target: Element) {
    this.targets = this.targets.filter((t) => t !== target);
  }

  disconnect() {
    this.targets = [];
    observers.delete(this);
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  intersect() {
    const entries = this.targets.map((target) => {
      const rect = target.getBoundingClientRect();
      return {
        target,
        isIntersecting: true,
        intersectionRatio: 1,
        boundingClientRect: rect,
        intersectionRect: rect,
        rootBounds: null,
        time: 0,
      };
    });
    if (entries.length > 0) this.callback(entries, this);
  }
}

/** Fires every live observer `times` times in a row, as fast scrolling would. */
function nearBottom(times = 1) {
  act(() => {
    for (let i = 0; i < times; i++) [...observers].forEach((observer) => observer.intersect());
  });
}

function postTitles() {
  return screen.queryAllByRole('article').map((a) => within(a).getByRole('heading').textContent);
}

beforeEach(() => {
  requestedSkips = [];
  requestedPostIds = [];
  observers.clear();
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  // The router's scroll restoration calls this; jsdom doesn't implement it.
  vi.stubGlobal('scrollTo', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('infinite feed', () => {
  it('loads the first page of 10 posts', async () => {
    mockPostsApi();
    renderRoute('/feed');

    expect(await screen.findByText('Loading posts...')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Post 10' })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(10);
    expect(requestedSkips).toEqual([0]);
  });

  it('requests each page exactly once however fast the user scrolls, then shows the end', async () => {
    mockPostsApi();
    renderRoute('/feed');
    await screen.findByRole('link', { name: 'Post 10' });

    nearBottom(5);
    expect(screen.getByText('Loading more posts...')).toBeInTheDocument();
    nearBottom(5); // still loading: ignored
    await screen.findByRole('link', { name: 'Post 20' });

    nearBottom(5);
    expect(await screen.findByText("You've reached the end")).toBeInTheDocument();
    nearBottom(5); // nothing left to load

    expect(requestedSkips).toEqual([0, 10, 20]);
    const titles = postTitles();
    expect(titles).toHaveLength(TOTAL);
    expect(new Set(titles).size).toBe(TOTAL);
  });

  it('never shows a post twice when pages overlap', async () => {
    // The second page shifted back by 3, repeating posts 8-10.
    mockPostsApi((skip, limit) =>
      skip === 10 ? pageResponse(skip, limit, allPosts.slice(7, 17)) : pageResponse(skip, limit),
    );
    renderRoute('/feed');
    await screen.findByRole('link', { name: 'Post 10' });

    nearBottom();
    await screen.findByRole('link', { name: 'Post 17' });

    const titles = postTitles();
    expect(titles).toHaveLength(17);
    expect(new Set(titles).size).toBe(17);
  });

  it('shows an error and retries only the page that failed', async () => {
    let failNextPage = true;
    mockPostsApi((skip, limit) => {
      if (skip === 10 && failNextPage) {
        failNextPage = false;
        return new HttpResponse(null, { status: 500 });
      }
      return pageResponse(skip, limit);
    });
    const { user } = renderRoute('/feed');
    await screen.findByRole('link', { name: 'Post 10' });

    nearBottom();
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Could not load more posts.');
    expect(screen.getAllByRole('article')).toHaveLength(10);

    nearBottom(3); // scrolling while errored does not silently retry
    expect(requestedSkips).toEqual([0, 10]);

    await user.click(within(alert).getByRole('button', { name: 'Retry' }));
    await screen.findByRole('link', { name: 'Post 20' });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(requestedSkips).toEqual([0, 10, 10]);
  });

  it('keeps the loaded posts when going to a post and back', async () => {
    mockPostsApi();
    const { user, router } = renderRoute('/feed');
    await screen.findByRole('link', { name: 'Post 10' });
    nearBottom();
    await screen.findByRole('link', { name: 'Post 20' });

    await user.click(screen.getByRole('link', { name: 'Post 15' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Post 15' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/feed/15');

    await user.click(screen.getByRole('link', { name: 'Back to feed' }));
    // Back is a POP (so the router restores scroll) and the posts are there straight away.
    expect(router.state.historyAction).toBe('POP');
    expect(router.state.location.pathname).toBe('/feed');
    expect(screen.getAllByRole('article')).toHaveLength(20);
    expect(requestedSkips).toEqual([0, 10]);
  });

  it('leaves modifier clicks on "Back to feed" to the browser', async () => {
    mockPostsApi();
    const { user, router } = renderRoute('/feed');
    await user.click(await screen.findByRole('link', { name: 'Post 3' }));
    const back = await screen.findByRole('link', { name: 'Back to feed' });

    // Ctrl/Cmd+click means "open in a new tab": this tab must stay on the post.
    await user.keyboard('{Control>}');
    await user.click(back);
    await user.keyboard('{/Control}');
    expect(router.state.location.pathname).toBe('/feed/3');

    await user.click(back);
    expect(router.state.location.pathname).toBe('/feed');
  });

  it('shows not found for an unknown post', async () => {
    mockPostsApi();
    renderRoute('/feed/999');
    expect(await screen.findByRole('heading', { name: 'Post not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to feed' })).toHaveAttribute('href', '/feed');
  });

  it.each(['abc', '1.5', '0', '-3'])(
    'shows not found for invalid post id %s without fetching',
    async (id) => {
      mockPostsApi();
      renderRoute(`/feed/${id}`);
      expect(screen.getByRole('heading', { name: 'Post not found' })).toBeInTheDocument();
      await Promise.resolve();
      expect(requestedPostIds).toEqual([]);
    },
  );
});
