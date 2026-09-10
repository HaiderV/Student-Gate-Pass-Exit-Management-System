/** Convert a 24h time string ("14:30") to a 12h display string ("02:30 PM"). */
export function to12Hour(time: string): string {
  const parts = time.split(':');
  const h = parseInt(parts[0] ?? '', 10);
  const m = parts[1] ?? '00';
  if (Number.isNaN(h)) return time;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const reduced = h % 12 === 0 ? 12 : h % 12;
  return `${String(reduced).padStart(2, '0')}:${m} ${suffix}`;
}

/** Current local time as a 24h "HH:MM" string (for <input type="time">). */
export function nowTime24(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Current local time as a 12h display string, e.g. "02:15 PM". */
export function nowTime12(): string {
  return to12Hour(nowTime24());
}

/** Time `minutes` from now as a 24h "HH:MM" string (for time inputs). */
export function timeAfterMinutes(minutes: number): string {
  const d = new Date(Date.now() + minutes * 60_000);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Today's date as a local "yyyy-mm-dd" string. */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Full ISO datetime string (used for stable sorting). */
export function nowISO(): string {
  return new Date().toISOString();
}

/** Human readable today, e.g. "Thursday, 11 Sep 2026". */
export function todayLabel(): string {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Time part of an ISO datetime as a 12h display string. */
export function timeFromISO(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const suffix = h >= 12 ? 'PM' : 'AM';
  const reduced = h % 12 === 0 ? 12 : h % 12;
  return `${String(reduced).padStart(2, '0')}:${m} ${suffix}`;
}

/** First letters of a name, e.g. "Rahul Sharma" -> "RS". */
export function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
