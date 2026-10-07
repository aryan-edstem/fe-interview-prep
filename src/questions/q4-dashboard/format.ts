const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const integer = new Intl.NumberFormat('en-US');
const signed = new Intl.NumberFormat('en-US', { signDisplay: 'exceptZero' });
const clock = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

export const formatCurrency = (amount: number) => currency.format(amount);
export const formatCount = (count: number) => integer.format(count);
export const formatDelta = (delta: number) => signed.format(delta);
export const formatTime = (epochMs: number) => clock.format(epochMs);
export const toIsoString = (epochMs: number) => new Date(epochMs).toISOString();

/** "just now", "3 min ago", "2 h ago"; falls back to the clock time beyond a day. */
export function formatRelative(epochMs: number, now: number) {
  const seconds = Math.max(0, Math.round((now - epochMs) / 1000));
  if (seconds < 45) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return formatTime(epochMs);
}
