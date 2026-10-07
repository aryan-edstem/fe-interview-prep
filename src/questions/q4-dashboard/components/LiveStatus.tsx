import { formatTime, toIsoString } from '../format';

interface LiveStatusProps {
  updatedAt: number;
  error: string | null;
  /** True while polling is paused because the tab is hidden. */
  paused: boolean;
}

/** Announces when the data was last refreshed and whether the latest refresh failed. */
export function LiveStatus({ updatedAt, error, paused }: LiveStatusProps) {
  return (
    <div role="status" className="flex flex-wrap items-center gap-2 lg:justify-end">
      {paused ? (
        <span className="badge badge-warning">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-amber-500" />
          Paused while this tab is hidden
        </span>
      ) : (
        <span className="badge badge-success">
          <span aria-hidden="true" className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:hidden" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          Live
        </span>
      )}
      {error && (
        <span className="badge badge-danger whitespace-normal">
          Refresh failed: {error}. Retrying.
        </span>
      )}
      <span className="text-xs text-slate-500">
        Updated{' '}
        <time dateTime={toIsoString(updatedAt)} className="tabular-nums">
          {formatTime(updatedAt)}
        </time>
      </span>
    </div>
  );
}
