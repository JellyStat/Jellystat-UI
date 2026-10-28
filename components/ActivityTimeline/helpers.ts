/** Number of entries rendered initially and added by each "show more" click. */
export const TIMELINE_PAGE_SIZE = 50;

/** True when both dates fall on the same calendar day (local time). */
export function isSameDay(a: string | Date, b: string | Date): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

/** Splits seconds into whole hours and remaining minutes (minutes rounded up so short plays never show 0). */
export function splitDuration(seconds: number): { hours: number; minutes: number } {
  const total = Math.max(0, Math.round(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.ceil((total % 3600) / 60);
  if (minutes === 60) return { hours: hours + 1, minutes: 0 };
  return { hours, minutes };
}

/** Parses a stored list of library ids, tolerating missing or corrupt values. */
export function parseStoredIds(raw: string | null): string[] | null {
  if (raw == null) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : null;
  } catch {
    return null;
  }
}
