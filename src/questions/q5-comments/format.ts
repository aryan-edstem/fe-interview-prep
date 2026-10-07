const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const absolute = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' });

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "just now", "5 minutes ago", "yesterday"; falls back to a date after a week. */
export function formatRelativeTime(iso: string, now: number): string {
  const time = new Date(iso).getTime();
  const diff = time - now;
  const abs = Math.abs(diff);
  if (abs < MINUTE) return 'just now';
  if (abs < HOUR) return relative.format(Math.round(diff / MINUTE), 'minute');
  if (abs < DAY) return relative.format(Math.round(diff / HOUR), 'hour');
  if (abs < 7 * DAY) return relative.format(Math.round(diff / DAY), 'day');
  return absolute.format(time);
}

export function formatAbsoluteTime(iso: string): string {
  return absolute.format(new Date(iso));
}

/** Up to two initials for an avatar, e.g. "Priya Shah" -> "PS". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
