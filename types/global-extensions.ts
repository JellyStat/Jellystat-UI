// Runtime extensions for built-in types.
// Implement Number#ticksToDurationString so nullable numbers can use optional chaining:
//   const s = item.duration?.ticksToDurationString();

Number.prototype.ticksToDurationString = function (): string | null {
  const ticks = Number(this.valueOf());
  if (!ticks) return null;
  // Convert ticks (100ns) -> total seconds
  let totalSeconds = Math.floor(ticks / 1e7);

  const sec = totalSeconds % 60;
  totalSeconds = Math.floor(totalSeconds / 60); // total minutes

  const min = totalSeconds % 60;
  totalSeconds = Math.floor(totalSeconds / 60); // total hours

  const hours = totalSeconds % 24;
  totalSeconds = Math.floor(totalSeconds / 24); // total days

  // Use simple month/year approximation: 1 month = 30 days, 1 year = 12 months
  const days = totalSeconds % 30;
  totalSeconds = Math.floor(totalSeconds / 30); // total months

  const months = totalSeconds % 12;
  const years = Math.floor(totalSeconds / 12);

  // Compose a human-readable unit-prefixed string, e.g. "1 Month 6 Days 21 Hours"
  const parts: string[] = [];
  const u = (value: number, singular: string, plural: string) => (value ? `${value} ${value === 1 ? singular : plural}` : null);

  const yearPart = u(years, "Year", "Years");
  const monthPart = u(months, "Month", "Months");
  const dayPart = u(days, "Day", "Days");
  const hourPart = u(hours, "Hour", "Hours");
  const minutePart = u(min, "Minute", "Minutes");
  const secondPart = u(sec, "Second", "Seconds");

  [yearPart, monthPart, dayPart, hourPart, minutePart, yearPart || monthPart || dayPart ? null : secondPart].forEach((p) => {
    if (p) parts.push(p);
  });

  // Limit to a maximum of three parts, starting from the highest unit.
  const limited = (parts as string[]).slice(0, 3);
  return limited.join(" ");
};

Number.prototype.secondsToDurationString = function (): string | null {
  const seconds = Number(this.valueOf());
  if (!seconds) return null;
  // Convert ticks (100ns) -> total seconds
  let totalSeconds = seconds;

  const sec = totalSeconds % 60;
  totalSeconds = Math.floor(totalSeconds / 60); // total minutes

  const min = totalSeconds % 60;
  totalSeconds = Math.floor(totalSeconds / 60); // total hours

  const hours = totalSeconds % 24;
  totalSeconds = Math.floor(totalSeconds / 24); // total days

  // Use simple month/year approximation: 1 month = 30 days, 1 year = 12 months
  const days = totalSeconds % 30;
  totalSeconds = Math.floor(totalSeconds / 30); // total months

  const months = totalSeconds % 12;
  const years = Math.floor(totalSeconds / 12);

  // Compose a human-readable unit-prefixed string, e.g. "1 Month 6 Days 21 Hours"
  const parts: string[] = [];
  const u = (value: number, singular: string, plural: string) => (value ? `${value} ${value === 1 ? singular : plural}` : null);

  const yearPart = u(years, "Year", "Years");
  const monthPart = u(months, "Month", "Months");
  const dayPart = u(days, "Day", "Days");
  const hourPart = u(hours, "Hour", "Hours");
  const minutePart = u(min, "Minute", "Minutes");
  const secondPart = u(sec, "Second", "Seconds");

  [yearPart, monthPart, dayPart, hourPart, minutePart, yearPart || monthPart || dayPart ? null : secondPart].forEach((p) => {
    if (p) parts.push(p);
  });

  // Limit to a maximum of three parts, starting from the highest unit.
  const limited = (parts as string[]).slice(0, 3);
  return limited.join(" ");
};

export {};
