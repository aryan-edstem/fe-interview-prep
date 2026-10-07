export interface Post {
  id: number;
  title: string;
  body: string;
  tags: string[];
  reactions: { likes: number; dislikes: number };
  views: number;
  userId: number;
}

/** One page of `GET /posts?limit=&skip=`. */
export interface PostsPage {
  posts: Post[];
  total: number;
  skip: number;
  limit: number;
}
