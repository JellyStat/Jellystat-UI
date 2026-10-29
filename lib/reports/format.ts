// Same rules as Services/Reports/Rendering/ReportFormatting.cs on the server, so the designer, the viewer and
// server exports format values identically. Change both together.
import type { ReportDataResult, ReportRenderModel } from "@/lib/models/reports";

export const VALUE_FORMATS = [
  "auto",
  "text",
  "link",
  "number",
  "integer",
  "decimal",
  "percent",
  "duration",
  "bytes",
  "date",
  "datetime",
  "time",
] as const;

const integerFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const decimalFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const numberFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const percentFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  useGrouping: false,
});

function autoFormat(columnType?: string | null): string {
  switch (columnType) {
    case "duration":
      return "duration";
    case "bytes":
      return "bytes";
    case "date":
      return "datetime";
    case "integer":
      return "integer";
    case "number":
      return "number";
    default:
      return "text";
  }
}

export function toNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === "string") {
    // Values without an offset are UTC, as on the server
    const iso = /[zZ]|[+-]\d\d:?\d\d$/.test(value) || !/\d\d:\d\d/.test(value) ? value : `${value}Z`;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

const pad = (n: number) => String(n).padStart(2, "0");
const zoneFormats = new Map<string, Intl.DateTimeFormat>();

/** Calendar parts of a UTC instant in a time zone (UTC when none or unknown), like the server's ReportFormatter. */
function localParts(d: Date, timeZone?: string | null) {
  if (timeZone && timeZone !== "UTC") {
    let fmt = zoneFormats.get(timeZone);
    if (!fmt) {
      try {
        fmt = new Intl.DateTimeFormat("en-US", {
          timeZone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        });
        zoneFormats.set(timeZone, fmt);
      } catch {
        fmt = undefined;
      }
    }
    if (fmt) {
      const parts = Object.fromEntries(fmt.formatToParts(d).map((p) => [p.type, p.value]));
      return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
    }
  }
  return {
    date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
    time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`,
  };
}

export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (d > 0) {
    return h > 0 ? `${d}d ${h}h` : `${d}d`;
  }
  if (h > 0) {
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  if (m > 0) {
    return `${m}m`;
  }
  return `${s}s`;
}

export function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let value = bytes;
  let u = 0;
  while (Math.abs(value) >= 1024 && u < units.length - 1) {
    value /= 1024;
    u++;
  }
  const text = u === 0 ? Math.round(value).toString() : (Math.round(value * 10) / 10).toString();
  return `${text} ${units[u]}`;
}

export function formatValue(value: unknown, format?: string | null, columnType?: string | null, timeZone?: string | null): string {
  if (value === null || value === undefined) {
    return "";
  }
  const f = !format || format === "auto" ? autoFormat(columnType) : format;
  const n = toNumber(value);
  switch (f) {
    case "integer":
      return n === null ? String(value) : integerFormat.format(Math.round(n));
    case "decimal":
      return n === null ? String(value) : decimalFormat.format(n);
    case "number":
      return n === null ? String(value) : numberFormat.format(n);
    case "percent":
      return n === null ? String(value) : `${percentFormat.format(n)}%`;
    case "duration":
      return n === null ? String(value) : formatDuration(n);
    case "bytes":
      return n === null ? String(value) : formatBytes(n);
    case "date":
    case "datetime":
    case "time": {
      const d = toDate(value);
      if (!d) {
        return String(value);
      }
      const local = localParts(d, timeZone);
      if (f === "date") {
        return local.date;
      }
      return f === "time" ? local.time : `${local.date} ${local.time}`;
    }
    default:
      if (typeof value === "boolean") {
        return value ? "Yes" : "No";
      }
      if (typeof value === "number") {
        return numberFormat.format(value);
      }
      return String(value);
  }
}

export function findData(model: Pick<ReportRenderModel, "data" | "definition">, nameOrId?: string | null): ReportDataResult | null {
  if (!nameOrId) {
    return null;
  }
  if (model.data[nameOrId]) {
    return model.data[nameOrId];
  }
  const source = model.definition.dataSources.find((d) => d.name.toLowerCase() === nameOrId.toLowerCase());
  return source ? (model.data[source.id] ?? null) : null;
}

const TOKEN = /\{\{\s*([^{}|]+?)\s*(?:\|\s*([a-zA-Z]+)\s*)?\}\}/g;

export const TOKEN_HELP = [
  { token: "{{report.name}}", description: "Report name" },
  { token: "{{now|datetime}}", description: "When the report was generated (UTC)" },
  { token: "{{param.NAME}}", description: "A report parameter" },
  { token: "{{ds.SOURCE.FIELD}}", description: "First row of a data source (name or id)" },
  { token: "{{ds.SOURCE.rowCount}}", description: "Number of rows" },
  { token: "{{page.number}} / {{page.count}}", description: "Page numbers" },
  {
    token: "{{...|duration}}",
    description: "Add |format: number, integer, percent, duration, bytes, date...",
  },
];

/** Only http, https and mailto links are followed; anything else (javascript:, file:...) gives null. */
export function safeLink(url: string | null | undefined): string | null {
  const u = url?.trim();
  if (!u) {
    return null;
  }
  try {
    const parsed = new URL(u);
    return ["http:", "https:", "mailto:"].includes(parsed.protocol) ? u : null;
  } catch {
    return null;
  }
}

/**
 * Builds a hyperlink like ReportTokenResolver.ResolveLink on the server: {{value}} is the linked value, {{row.FIELD}}
 * another column of the row, other tokens as usual. A token at the very start goes in as it is (the URL or its base);
 * anywhere else it is URL-encoded. An empty template uses the value itself.
 */
export function resolveLink(
  template: string | null | undefined,
  value: unknown,
  row: Record<string, unknown> | null,
  model: Pick<ReportRenderModel, "data" | "definition" | "name" | "parameters" | "generatedAt">,
  pageNumber: number,
  pageCount: number,
): string | null {
  const t = template?.trim() || "{{value}}";
  const url = t.replace(TOKEN, (match, path: string, format: string | undefined, offset: number) => {
    let v: unknown;
    const p = path.trim();
    if (p.toLowerCase() === "value") {
      v = value;
    } else if (p.toLowerCase().startsWith("row.") && row) {
      const field = p.slice(4).toLowerCase();
      const key = Object.keys(row).find((k) => k.toLowerCase() === field);
      v = key === undefined ? null : row[key];
    } else {
      const resolved = resolveTokens(match, model, pageNumber, pageCount);
      v = resolved === match ? "" : resolved;
    }
    const text = v === null || v === undefined ? "" : format && p.toLowerCase() === "value" ? formatValue(v, format) : String(v);
    return offset === 0 ? text.trim() : encodeURIComponent(text);
  });
  return safeLink(url);
}

/** Replaces {{tokens}} the same way ReportTokenResolver does on the server. Unknown tokens are left as they are. */
export function resolveTokens(
  text: string | null | undefined,
  model: Pick<ReportRenderModel, "data" | "definition" | "name" | "parameters" | "generatedAt">,
  pageNumber: number,
  pageCount: number,
): string {
  if (!text) {
    return "";
  }
  return text.replace(TOKEN, (match, path: string, format?: string) => {
    const parts = path.split(".");
    const head = parts[0].toLowerCase();
    let value: unknown;
    let type: string | null = null;
    if (head === "now") {
      value = model.generatedAt;
      type = "date";
    } else if (head === "report" && parts[1]?.toLowerCase() === "name") {
      value = model.name;
    } else if (head === "page" && parts.length > 1) {
      value = parts[1].toLowerCase() === "count" ? pageCount : pageNumber;
      type = "integer";
    } else if (head === "param" && parts.length > 1) {
      const key = Object.keys(model.parameters).find((k) => k.toLowerCase() === parts[1].toLowerCase());
      if (key === undefined) {
        return match;
      }
      value = model.parameters[key];
    } else if (head === "ds" && parts.length > 2) {
      const data = findData(model, parts[1]);
      const field = parts.slice(2).join(".");
      if (!data) {
        return match;
      }
      if (field.toLowerCase() === "rowcount") {
        value = data.rows.length;
        type = "integer";
      } else {
        const column = data.columns.find((c) => c.name.toLowerCase() === field.toLowerCase());
        if (!column) {
          return match;
        }
        value = data.rows[0]?.[column.name] ?? null;
        type = column.type;
      }
    } else {
      return match;
    }
    return formatValue(value, format, type, model.definition.timeZone);
  });
}
