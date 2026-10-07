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

export function WidgetToggles({ visibility, onChange }: WidgetTogglesProps) {
  return (
    <fieldset className="rounded-lg border border-slate-200 bg-white px-4 pt-1 pb-3">
      <legend className="px-1 text-sm font-medium text-slate-700">Show widgets</legend>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {WIDGETS.map(({ id, label }) => (
          <label key={id} className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="size-4 accent-indigo-600"
              checked={visibility[id]}
              onChange={(event) => onChange(id, event.target.checked)}
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
