export interface OfflineBannerProps {
  queued: number;
}

export function OfflineBanner({ queued }: OfflineBannerProps) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      <p className="font-medium">You're offline.</p>
      <p>
        {queued > 0
          ? `${queued} ${queued === 1 ? 'comment is' : 'comments are'} queued and will be sent in order when the connection returns.`
          : 'New comments will be queued and sent when the connection returns.'}
      </p>
    </div>
  );
}
