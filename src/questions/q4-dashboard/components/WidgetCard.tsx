import { useId, type ReactNode } from 'react';
import { formatTime, toIsoString } from '../format';

interface WidgetCardProps {
  title: string;
  /** When this widget's data last changed. */
  updatedAt: number;
  className?: string;
  children: ReactNode;
}

/** Shared chrome for a dashboard widget: a labelled card with its own "Updated" time. */
export function WidgetCard({ title, updatedAt, className = '', children }: WidgetCardProps) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className={`card card-body flex flex-col ${className}`}>
      <header className="mb-4 flex items-baseline justify-between gap-3">
        <h2 id={headingId} className="text-sm font-medium text-slate-500">
          {title}
        </h2>
        <p className="text-xs whitespace-nowrap text-slate-500">
          Updated{' '}
          <time dateTime={toIsoString(updatedAt)} className="tabular-nums">
            {formatTime(updatedAt)}
          </time>
        </p>
      </header>
      {children}
    </section>
  );
}
