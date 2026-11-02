const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), UNITS.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(value < 10 ? 1 : 0)} ${UNITS[exponent]}`;
}

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });
const fullFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'full', timeStyle: 'medium' });
const dayFormat = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
const relativeFormat = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

export const formatTime = (timestamp: number) => timeFormat.format(timestamp);
export const formatFullDate = (timestamp: number) => fullFormat.format(timestamp);

const startOfDay = (timestamp: number) => new Date(timestamp).setHours(0, 0, 0, 0);
export const isSameDay = (a: number, b: number) => startOfDay(a) === startOfDay(b);

export function formatDay(timestamp: number) {
  const days = Math.round((startOfDay(Date.now()) - startOfDay(timestamp)) / 86_400_000);
  if (days > 1) return dayFormat.format(timestamp);
  const label = relativeFormat.format(-days, 'day');
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const RELATIVE_STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
];

export function formatRelative(timestamp: number) {
  const diff = timestamp - Date.now();
  for (const [unit, ms] of RELATIVE_STEPS) {
    if (Math.abs(diff) >= ms) return relativeFormat.format(Math.round(diff / ms), unit);
  }
  return 'just now';
}

export const getExtension = (name: string) => {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot + 1).toUpperCase() : 'FILE';
};
