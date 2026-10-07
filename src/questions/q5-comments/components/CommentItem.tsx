import { formatAbsoluteTime, formatRelativeTime, initials } from '../format';
import type { ThreadEntry } from '../types';
import { StatusBadge } from './StatusBadge';

export interface CommentItemProps {
  entry: ThreadEntry;
  online: boolean;
  /** Author name of the person using the page; their confirmed comments are badged "Sent". */
  currentAuthor: string;
  /** Current time (ms) for relative timestamps. */
  now: number;
  onRetry: (clientId: string) => void;
  onDiscard: (clientId: string) => void;
}

const AVATAR_TONES = [
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-800',
  'bg-rose-100 text-rose-700',
  'bg-violet-100 text-violet-700',
];

function avatarTone(name: string, isCurrent: boolean) {
  if (isCurrent) return 'bg-brand-600 text-white';
  const hash = [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return AVATAR_TONES[hash % AVATAR_TONES.length] ?? 'bg-slate-100 text-slate-700';
}

export function CommentItem({
  entry,
  online,
  currentAuthor,
  now,
  onRetry,
  onDiscard,
}: CommentItemProps) {
  const data = entry.kind === 'confirmed' ? entry.comment : entry.item;
  const pending = entry.kind === 'pending' ? entry.item : null;
  const failed = pending?.status === 'failed' ? pending : null;
  const isCurrent = data.author === currentAuthor;

  return (
    <li className={`px-4 py-4 sm:px-5 ${failed ? 'bg-rose-50/40' : ''}`}>
      <article aria-label={`Comment by ${data.author}`} className="flex gap-3">
        <span
          aria-hidden="true"
          className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${avatarTone(data.author, isCurrent)} ${pending ? 'opacity-70' : ''}`}
        >
          {initials(data.author)}
        </span>
        <div className="min-w-0 flex-1">
          <header className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-semibold text-slate-900">{data.author}</span>
            <time
              dateTime={data.createdAt}
              title={formatAbsoluteTime(data.createdAt)}
              className="text-xs text-slate-500"
            >
              {formatRelativeTime(data.createdAt, now)}
            </time>
            <span className="ml-auto">
              {pending ? (
                <StatusBadge
                  status={pending.status}
                  online={online}
                  blocked={entry.kind === 'pending' && entry.blocked}
                />
              ) : (
                isCurrent && <StatusBadge status="sent" online={online} />
              )}
            </span>
          </header>
          <p
            className={`mt-1 text-sm leading-relaxed break-words whitespace-pre-wrap ${
              pending ? 'text-slate-500' : 'text-slate-700'
            }`}
          >
            {data.body}
          </p>
          {failed && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="text-xs text-rose-700">{failed.error}.</p>
              <button
                type="button"
                onClick={() => onRetry(failed.clientId)}
                className="btn btn-secondary btn-sm"
              >
                Retry
              </button>
              <button
                type="button"
                onClick={() => onDiscard(failed.clientId)}
                className="btn btn-ghost btn-sm"
              >
                Discard
              </button>
            </div>
          )}
        </div>
      </article>
    </li>
  );
}
