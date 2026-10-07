import type { WidgetId, WidgetVisibility } from '../types';

const WIDGETS: readonly { id: WidgetId; label: string }[] = [
  { id: 'sales', label: 'Sales today' },
  { id: 'activeUsers', label: 'Active users' },
  { id: 'recentOrders', label: 'Recent orders' },
];

interface WidgetTogglesProps {
  visibility: WidgetVisibility;
  onChange: (id: WidgetId, visible: boolean) => void;
}

/** Pill-style checkboxes; the native input stays focusable and announced. */
export function WidgetToggles({ visibility, onChange }: WidgetTogglesProps) {
  return (
    <fieldset className="flex flex-wrap items-center gap-2 lg:justify-end">
      <legend className="sr-only">Show widgets</legend>
      <span aria-hidden="true" className="mr-1 text-xs font-medium text-slate-500">
        Show
      </span>
      {WIDGETS.map(({ id, label }) => (
        <label
          key={id}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1 text-sm font-medium text-slate-600 shadow-sm transition select-none hover:border-slate-400 hover:text-slate-900 has-checked:border-brand-500 has-checked:bg-brand-50 has-checked:text-brand-700 has-focus-visible:ring-2 has-focus-visible:ring-brand-100"
        >
          <input
            type="checkbox"
            className="size-3.5 accent-brand-600"
            checked={visibility[id]}
            onChange={(event) => onChange(id, event.target.checked)}
          />
          {label}
        </label>
      ))}
    </fieldset>
  );
}
