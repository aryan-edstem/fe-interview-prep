const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const integer = new Intl.NumberFormat('en-US');
const clock = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

export const formatCurrency = (amount: number) => currency.format(amount);
export const formatCount = (count: number) => integer.format(count);
export const formatTime = (epochMs: number) => clock.format(epochMs);
export const toIsoString = (epochMs: number) => new Date(epochMs).toISOString();
