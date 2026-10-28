import i18n from "./i18n";

/** "auto" follows the display language's convention; "12" / "24" force a clock style. */
export type HourFormat = "auto" | "12" | "24";

export const HOUR_FORMAT_STORAGE_KEY = "PREF_HOUR_FORMAT";

export function getHourFormat(): HourFormat {
  if (typeof window === "undefined") return "auto";
  try {
    const stored = window.localStorage.getItem(HOUR_FORMAT_STORAGE_KEY);
    return stored === "12" || stored === "24" ? stored : "auto";
  } catch {
    return "auto";
  }
}

export function setHourFormat(format: HourFormat) {
  if (typeof window === "undefined") return;
  try {
    if (format === "auto") window.localStorage.removeItem(HOUR_FORMAT_STORAGE_KEY);
    else window.localStorage.setItem(HOUR_FORMAT_STORAGE_KEY, format);
  } catch {
    /* ignore storage errors */
  }
}

// hourCycle rather than hour12: some browsers render midnight as "24:00" with hour12=false
function hourCycleOption(): Pick<Intl.DateTimeFormatOptions, "hourCycle"> {
  const format = getHourFormat();
  if (format === "12") return { hourCycle: "h12" };
  if (format === "24") return { hourCycle: "h23" };
  return {};
}

function locale(): string | undefined {
  return i18n.language || undefined;
}

function toDate(value: string | number | Date | null | undefined): Date | null {
  if (value == null || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

const DEFAULT_DATE_TIME: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
};

/** Date and time, honouring the user's 12/24-hour preference. Returns "" for empty or invalid input. */
export function formatDateTime(
  value: string | number | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = DEFAULT_DATE_TIME,
): string {
  const d = toDate(value);
  return d ? d.toLocaleString(locale(), { ...options, ...hourCycleOption() }) : "";
}

/** Time of day (hours and minutes), honouring the user's 12/24-hour preference. */
export function formatTime(value: string | number | Date | null | undefined): string {
  const d = toDate(value);
  return d ? d.toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit", ...hourCycleOption() }) : "";
}

/** Label for an hour of the day (0-23), e.g. "13:00" or "01:00 PM". */
export function formatHourOfDay(hour: number): string {
  return formatTime(new Date(2000, 0, 1, hour, 0, 0));
}
