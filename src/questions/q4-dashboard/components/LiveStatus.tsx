import { formatTime, toIsoString } from '../format';

interface LiveStatusProps {
  updatedAt: number;
  error: string | null;
}

/** Announces when the data was last refreshed and whether the latest refresh failed. */
export function LiveStatus({ updatedAt, error }: LiveStatusProps) {
  return (
    <div role="status" className="flex flex-wrap items-center gap-2 text-sm">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 font-medium text-emerald-800">
        <span aria-hidden="true" className="size-2 rounded-full bg-emerald-500" />
        Live
      </span>
      <span className="text-slate-600">
        Updated <time dateTime={toIsoString(updatedAt)}>{formatTime(updatedAt)}</time>
      </span>
      {error && (
        <span className="rounded-full bg-red-50 px-2.5 py-0.5 font-medium text-red-800 ring-1 ring-red-600/20 ring-inset">
          Refresh failed: {error}. Showing the last good data and retrying.
        </span>
      )}
    </div>
  );
}
