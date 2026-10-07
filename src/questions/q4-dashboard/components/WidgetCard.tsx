import { useId, type ReactNode } from 'react';

interface WidgetCardProps {
  title: string;
  className?: string;
  children: ReactNode;
}

/** Shared chrome for a dashboard widget: a labelled region with a heading. */
export function WidgetCard({ title, className = '', children }: WidgetCardProps) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
    >
      <header className="mb-3 flex items-baseline justify-between gap-2">
        <h2 id={headingId} className="text-sm font-medium text-slate-600">
          {title}
        </h2>
      </header>
      {children}
    </section>
  );
}
