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

// Top-level ticksToTimeString so it's always available at runtime
Number.prototype.ticksToTimeString = function (): string | null {
  const ticks = Number(this.valueOf());
  if (!ticks) return null;
  // Convert ticks (100ns) -> total seconds
  let totalSeconds = Math.floor(ticks / 1e7);
  const sec = totalSeconds % 60;
  totalSeconds = Math.floor(totalSeconds / 60); // total minutes
  const min = totalSeconds % 60;
  totalSeconds = Math.floor(totalSeconds / 60); // total hours
  let hours = totalSeconds % 24;

  // Compose a human-readable unit-prefixed string, e.g. "1:06:21"
  if (!hours) hours = 0; // ensure hours is always defined for consistent formatting
  const parts: string[] = [];
  parts.push(hours.toString().padStart(2, "0"));
  parts.push(min.toString().padStart(2, "0"));
  parts.push(sec.toString().padStart(2, "0"));
  return parts.join(":");
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

Number.prototype.secondsToTimeString = function (): string | null {
  const seconds = Number(this.valueOf());
  if (!seconds) return null;
  // Convert ticks (100ns) -> total seconds
  let totalSeconds = seconds;
  const sec = totalSeconds % 60;
  totalSeconds = Math.floor(totalSeconds / 60);
  const min = totalSeconds % 60;
  totalSeconds = Math.floor(totalSeconds / 60);
  let hours = totalSeconds % 24;

  // Compose a human-readable unit-prefixed string, e.g. "1:06:21"
  if (!hours) hours = 0;
  const parts: string[] = [];
  parts.push(hours.toString().padStart(2, "0"));
  parts.push(min.toString().padStart(2, "0"));
  parts.push(sec.toString().padStart(2, "0"));
  return parts.join(":");
};

Number.prototype.formatBytes = function (): string | null {
  const bytes = Number(this.valueOf());
  if (!bytes) return null;
  if (!bytes || bytes <= 0) return "0.00 KB";
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

export {};
