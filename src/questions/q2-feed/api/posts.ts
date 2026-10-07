import type { Post, PostsPage } from '../types';

const POSTS_URL = 'https://dummyjson.com/posts';
export const PAGE_SIZE = 10;

export class HttpError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Request failed with status ${status}`);
    this.name = 'HttpError';
    this.status = status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function invalid(): never {
  throw new Error('Unexpected response from the posts API');
}

function parsePost(value: unknown): Post {
  if (!isRecord(value)) invalid();
  const { id, title, body, tags, reactions, views, userId } = value;
  if (typeof id !== 'number' || typeof title !== 'string' || typeof body !== 'string') invalid();
  const likes = isRecord(reactions) && typeof reactions.likes === 'number' ? reactions.likes : 0;
  const dislikes =
    isRecord(reactions) && typeof reactions.dislikes === 'number' ? reactions.dislikes : 0;
  return {
    id,
    title,
    body,
    tags: Array.isArray(tags) ? tags.filter((t): t is string => typeof t === 'string') : [],
    reactions: { likes, dislikes },
    views: typeof views === 'number' ? views : 0,
    userId: typeof userId === 'number' ? userId : 0,
  };
}

function parsePostsPage(value: unknown): PostsPage {
  if (!isRecord(value) || !Array.isArray(value.posts)) invalid();
  const { total, skip, limit } = value;
  if (typeof total !== 'number' || typeof skip !== 'number' || typeof limit !== 'number') {
    invalid();
  }
  return { posts: value.posts.map(parsePost), total, skip, limit };
}

async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new HttpError(response.status);
  return response.json();
}

/** Fetches one page of `PAGE_SIZE` posts starting at `skip`. */
export async function fetchPostsPage(skip: number, signal?: AbortSignal): Promise<PostsPage> {
  return parsePostsPage(await getJson(`${POSTS_URL}?limit=${PAGE_SIZE}&skip=${skip}`, signal));
}

export async function fetchPost(id: number, signal?: AbortSignal): Promise<Post> {
  return parsePost(await getJson(`${POSTS_URL}/${id}`, signal));
}
