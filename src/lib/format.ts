/**
 * Locale-aware date/time helpers (SPEC §9.5). Always Latin digits (SPEC §3.9).
 * Never build date strings by hand — everything goes through Intl.
 */
export type AppLocale = 'ar' | 'en';

const tag = (l: AppLocale) => (l === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US');

/** '08:00' or '08:00:00' (a schedule time, no timezone) -> '8:00 AM' / '8:00 ص' */
export function formatClock(hhmm: string, locale: AppLocale): string {
  const [h, m] = hhmm.split(':').map(Number);
  return new Intl.DateTimeFormat(tag(locale), {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(2000, 0, 1, h || 0, m || 0)));
}

/** A real instant, shown in the patient's timezone. */
export function formatTimeAt(iso: string | Date, locale: AppLocale, tz: string): string {
  return new Intl.DateTimeFormat(tag(locale), {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: tz,
  }).format(new Date(iso));
}

/** 'YYYY-MM-DD' of an instant in a timezone. */
export function dayKey(iso: string | Date, tz: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
}

export function hourIn(date: Date, tz: string): number {
  const h = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    hour12: false,
  }).format(date);
  return Number(h) % 24;
}

export function formatLongDate(date: Date, locale: AppLocale, tz: string): string {
  return new Intl.DateTimeFormat(tag(locale), {
    timeZone: tz,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

/** 'Today' / 'Yesterday' (localised) or a short weekday + date. */
export function formatDayHeading(key: string, todayKey: string, locale: AppLocale): string {
  const diff = Math.round((Date.parse(`${key}T00:00:00Z`) - Date.parse(`${todayKey}T00:00:00Z`)) / 86400000);
  if (diff === 0 || diff === -1) {
    return new Intl.RelativeTimeFormat(tag(locale), { numeric: 'auto' }).format(diff, 'day');
  }
  return new Intl.DateTimeFormat(tag(locale), {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${key}T00:00:00Z`));
}

function offsetMs(tz: string, at: Date): number {
  const v =
    new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' })
      .formatToParts(at)
      .find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
  const m = /GMT([+-])(\d{1,2}):?(\d{2})?/.exec(v);
  if (!m) return 0;
  return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0)) * 60000;
}

function startOfZonedDay(key: string, tz: string): Date {
  const base = Date.parse(`${key}T00:00:00Z`);
  let guess = base;
  for (let i = 0; i < 2; i++) guess = base - offsetMs(tz, new Date(guess));
  return new Date(guess);
}

export function addDays(key: string, n: number): string {
  return new Date(Date.parse(`${key}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
}

/** [start, end) of "today" for a timezone, as ISO instants. */
export function zonedDayRange(tz: string, now = new Date()) {
  const key = dayKey(now, tz);
  return {
    key,
    startISO: startOfZonedDay(key, tz).toISOString(),
    endISO: startOfZonedDay(addDays(key, 1), tz).toISOString(),
  };
}

/** days_of_week (0=Sunday..6=Saturday) -> 'Every day' | 'Sun, Tue' */
export function formatDays(days: number[], locale: AppLocale, everyDay: string): string {
  const uniq = [...new Set(days)].sort();
  if (uniq.length === 7) return everyDay;
  const f = new Intl.DateTimeFormat(tag(locale), { weekday: 'short', timeZone: 'UTC' });
  // 2023-01-01 is a Sunday
  return uniq.map((d) => f.format(new Date(Date.UTC(2023, 0, 1 + d)))).join(locale === 'ar' ? '، ' : ', ');
}
