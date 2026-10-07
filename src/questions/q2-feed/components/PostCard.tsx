import { Link } from 'react-router';
import type { Post } from '../types';

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="card card-interactive card-body">
      <h2 className="mb-1.5 text-lg leading-snug font-semibold">
        <Link
          to={String(post.id)}
          state={{ fromFeed: true }}
          className="rounded-sm text-slate-900 hover:text-brand-700"
        >
          {post.title}
        </Link>
      </h2>
      <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-slate-600">{post.body}</p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <ul aria-label="Tags" className="flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <li key={tag} className="badge badge-neutral">
              #{tag}
            </li>
          ))}
        </ul>
        <p className="ml-auto text-xs text-slate-500">
          {post.reactions.likes.toLocaleString()} likes · {post.views.toLocaleString()} views
        </p>
      </div>
    </article>
  );
}

/** Placeholder with the same shape as a PostCard, shown while a page loads. */
export function PostCardSkeleton() {
  return (
    <div aria-hidden="true" className="card card-body">
      <div className="skeleton mb-3 h-5 w-2/3" />
      <div className="skeleton mb-2 h-3.5 w-full" />
      <div className="skeleton mb-5 h-3.5 w-5/6" />
      <div className="flex gap-1.5">
        <div className="skeleton h-5 w-16 rounded-full" />
        <div className="skeleton h-5 w-14 rounded-full" />
        <div className="skeleton ml-auto h-4 w-28" />
      </div>
    </div>
  );
}
