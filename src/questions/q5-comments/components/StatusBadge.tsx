import type { OutboxStatus } from '../types';

export interface StatusBadgeProps {
  status: OutboxStatus;
  online: boolean;
  /** Queued behind a failed comment, which must be retried or discarded first. */
  blocked?: boolean;
}

const tone: Record<OutboxStatus, string> = {
  sent: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  sending: 'bg-sky-50 text-sky-800 ring-sky-200',
  queued: 'bg-amber-50 text-amber-900 ring-amber-200',
  failed: 'bg-red-50 text-red-800 ring-red-200',
};

function statusLabel({ status, online, blocked = false }: StatusBadgeProps): string {
  switch (status) {
    case 'sent':
      return 'Sent';
    case 'sending':
      return 'Sending…';
    case 'failed':
      return 'Failed to send';
    case 'queued':
      if (!online) return 'Queued — offline';
      return blocked ? 'Queued — waiting for an earlier comment' : 'Queued';
  }
}

/** Status as text (colour is only a secondary cue). */
export function StatusBadge(props: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${tone[props.status]}`}
    >
      {props.status === 'sending' && (
        <span
          aria-hidden="true"
          className="size-2 animate-pulse rounded-full bg-current motion-reduce:animate-none"
        />
      )}
      {statusLabel(props)}
    </span>
  );
}
