import type { ThreadEntry } from '../types';
import { StatusBadge } from './StatusBadge';

export interface CommentItemProps {
  entry: ThreadEntry;
  online: boolean;
  /** Author name of the person using the page; their confirmed comments are badged "Sent". */
  currentAuthor: string;
  onRetry: (clientId: string) => void;
  onDiscard: (clientId: string) => void;
}

const timeFormat = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' });

export function CommentItem({
  entry,
  online,
  currentAuthor,
  onRetry,
  onDiscard,
}: CommentItemProps) {
  const data = entry.kind === 'confirmed' ? entry.comment : entry.item;
  const pending = entry.kind === 'pending' ? entry.item : null;
  const failed = pending?.status === 'failed' ? pending : null;

  return (
    <li
      className={`rounded-lg border bg-white p-4 shadow-sm ${
        failed ? 'border-red-300' : pending ? 'border-dashed border-slate-300' : 'border-slate-200'
      }`}
    >
      <article aria-label={`Comment by ${data.author}`}>
        <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-medium text-slate-900">{data.author}</span>
          <time dateTime={data.createdAt} className="text-xs text-slate-500">
            {timeFormat.format(new Date(data.createdAt))}
          </time>
          {pending ? (
            <StatusBadge
              status={pending.status}
              online={online}
              blocked={entry.kind === 'pending' && entry.blocked}
            />
          ) : (
            data.author === currentAuthor && <StatusBadge status="sent" online={online} />
          )}
        </header>
        <p
          className={`mt-2 whitespace-pre-wrap break-words ${pending ? 'text-slate-600' : 'text-slate-800'}`}
        >
          {data.body}
        </p>
        {failed && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <p className="text-sm text-red-700">{failed.error}.</p>
            <button
              type="button"
              onClick={() => onRetry(failed.clientId)}
              className="rounded-md bg-slate-900 px-3 py-1 text-sm font-medium text-white hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => onDiscard(failed.clientId)}
              className="rounded-md px-3 py-1 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              Discard
            </button>
          </div>
        )}
      </article>
    </li>
  );
}
