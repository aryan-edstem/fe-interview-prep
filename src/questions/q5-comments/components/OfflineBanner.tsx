export interface OfflineBannerProps {
  queued: number;
}

export function OfflineBanner({ queued }: OfflineBannerProps) {
  return (
    <div role="alert" className="alert alert-warning">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-1 size-2.5 shrink-0 rounded-full bg-amber-500 ring-4 ring-amber-200"
        />
        <div>
          <p className="font-semibold">You're offline.</p>
          <p>
            {queued > 0
              ? `${queued} ${queued === 1 ? 'comment is' : 'comments are'} queued and will be sent in order when the connection returns.`
              : 'New comments will be queued and sent when the connection returns.'}
          </p>
        </div>
      </div>
      {queued > 0 && (
        <span className="badge badge-warning ring-1 ring-amber-300">{queued} queued</span>
      )}
    </div>
  );
}
