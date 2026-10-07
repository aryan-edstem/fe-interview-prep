import type { OutboxStatus } from '../types';

export interface StatusBadgeProps {
  status: OutboxStatus;
  online: boolean;
  /** Queued behind a failed comment, which must be retried or discarded first. */
  blocked?: boolean;
}

function describe({ status, online, blocked = false }: StatusBadgeProps) {
  switch (status) {
    case 'sent':
      return { label: 'Sent', tone: 'badge-success' };
    case 'sending':
      return { label: 'Sending…', tone: 'badge-brand' };
    case 'failed':
      return { label: 'Failed to send', tone: 'badge-danger' };
    case 'queued':
      if (!online) return { label: 'Queued — offline', tone: 'badge-warning' };
      return blocked
        ? { label: 'Queued — waiting for an earlier comment', tone: 'badge-neutral' }
        : { label: 'Queued', tone: 'badge-neutral' };
  }
}

/** Status as text; colour and the spinner are secondary cues. */
export function StatusBadge(props: StatusBadgeProps) {
  const { label, tone } = describe(props);
  return (
    <span className={`badge ${tone}`}>
      {props.status === 'sending' && (
        <span aria-hidden="true" className="spinner size-3 border-[1.5px]" />
      )}
      {label}
    </span>
  );
}
