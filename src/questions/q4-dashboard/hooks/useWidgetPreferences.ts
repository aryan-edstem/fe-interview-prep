import { useEffect, useState } from 'react';
import type { WidgetId, WidgetVisibility } from '../types';

export const WIDGET_STORAGE_KEY = 'q4-dashboard:visible-widgets';

const ALL_VISIBLE: WidgetVisibility = { sales: true, activeUsers: true, recentOrders: true };

/** Reads the saved choice, falling back to "show" for anything missing, malformed or unreadable. */
function readVisibility(): WidgetVisibility {
  try {
    const raw = localStorage.getItem(WIDGET_STORAGE_KEY);
    if (!raw) return ALL_VISIBLE;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return ALL_VISIBLE;
    const stored: Partial<Record<WidgetId, unknown>> = parsed;
    const read = (id: WidgetId) => {
      const value = stored[id];
      return typeof value === 'boolean' ? value : true;
    };
    return {
      sales: read('sales'),
      activeUsers: read('activeUsers'),
      recentOrders: read('recentOrders'),
    };
  } catch {
    return ALL_VISIBLE;
  }
}

/** Which widgets are shown, persisted to localStorage so the choice survives a reload. */
export function useWidgetPreferences() {
  const [visibility, setVisibility] = useState(readVisibility);

  useEffect(() => {
    try {
      localStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(visibility));
    } catch {
      // Storage unavailable (private mode, quota): the choice still applies for this visit.
    }
  }, [visibility]);

  function setWidgetVisible(id: WidgetId, visible: boolean) {
    setVisibility((prev) => ({ ...prev, [id]: visible }));
  }

  return { visibility, setWidgetVisible };
}
