import { Link } from 'react-router';
import type { Post } from '../types';

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-1 text-lg font-semibold">
        <Link
          to={String(post.id)}
          state={{ fromFeed: true }}
          className="text-slate-900 hover:text-blue-700 hover:underline"
        >
          {post.title}
        </Link>
      </h2>
      <p className="mb-3 line-clamp-2 text-sm text-slate-600">{post.body}</p>
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {post.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
            #{tag}
          </span>
        ))}
        <span className="ml-auto">
          {post.reactions.likes} likes · {post.views} views
        </span>
      </div>
    </article>
  );
}
