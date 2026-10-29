// Conditional formatting, same rules as ReportConditions in Services/Reports/Rendering/ReportLayout.cs on the
// server, so the viewer and server exports colour the same rows. Change both together.
import type { ReportCondition } from "@/lib/models/reports";
import { toNumber } from "./format";

export const CONDITION_OPERATORS = [
  { value: "eq", label: "equals" },
  { value: "neq", label: "does not equal" },
  { value: "gt", label: "greater than" },
  { value: "gte", label: "at least" },
  { value: "lt", label: "less than" },
  { value: "lte", label: "at most" },
  { value: "contains", label: "contains" },
  { value: "notContains", label: "does not contain" },
  { value: "isNull", label: "is empty" },
  { value: "isNotNull", label: "is not empty" },
];

export interface ConditionStyle {
  color?: string | null;
  background?: string | null;
  bold?: boolean | null;
}

const text = (v: unknown) => (v === null || v === undefined ? "" : typeof v === "boolean" ? (v ? "true" : "false") : String(v));

const asDate = (v: unknown): number | null => {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(v)) {
    return null;
  }
  const t = Date.parse(/[zZ]|[+-]\d{2}:?\d{2}$/.test(v) ? v : `${v}Z`);
  return Number.isNaN(t) ? null : t;
};

export function conditionMatches(c: ReportCondition, row: Record<string, unknown>): boolean {
  if (!c.field) {
    return false;
  }
  const key = Object.keys(row).find((k) => k.toLowerCase() === c.field.toLowerCase());
  const value = key === undefined ? null : row[key];
  const empty = value === null || value === undefined || value === "";
  if (c.operator === "isNull") {
    return empty;
  }
  if (c.operator === "isNotNull") {
    return !empty;
  }
  const target = c.value ?? null;
  if (c.operator === "contains" || c.operator === "notContains") {
    const contains = text(value).toLowerCase().includes(text(target).toLowerCase());
    return c.operator === "contains" ? contains : !contains;
  }

  let cmp: number | null = null;
  if (value !== null && value !== undefined && target !== null) {
    const a = typeof value === "number" ? value : null;
    const b = toNumber(target);
    const da = asDate(value);
    const db = asDate(target);
    if (a !== null && b !== null) {
      cmp = Math.sign(a - b);
    } else if (da !== null && db !== null) {
      cmp = Math.sign(da - db);
    } else if (typeof value === "boolean") {
      cmp = text(value) === text(target).toLowerCase() ? 0 : 1;
    } else {
      const x = text(value).toLowerCase();
      const y = text(target).toLowerCase();
      cmp = x === y ? 0 : x < y ? -1 : 1;
    }
  }
  const bothEmpty = (value === null || value === undefined) && target === null;
  switch (c.operator) {
    case "eq":
      return cmp === 0 || bothEmpty;
    case "neq":
      return (cmp !== null && cmp !== 0) || (value === null || value === undefined) !== (target === null);
    case "gt":
      return cmp !== null && cmp > 0;
    case "gte":
      return cmp !== null && cmp >= 0;
    case "lt":
      return cmp !== null && cmp < 0;
    case "lte":
      return cmp !== null && cmp <= 0;
    default:
      return false;
  }
}

/** The style matching conditions give a row (target null) or one of its columns; later ones win. Null when none match. */
export function conditionStyle(
  conditions: ReportCondition[] | null | undefined,
  row: Record<string, unknown>,
  target: string | null,
): ConditionStyle | null {
  let style: ConditionStyle | null = null;
  for (const c of conditions ?? []) {
    const t = c.target?.trim() ? c.target : null;
    if ((t ?? "").toLowerCase() !== (target ?? "").toLowerCase() || !conditionMatches(c, row)) {
      continue;
    }
    style = { ...(style ?? {}) };
    if (c.color) {
      style.color = c.color;
    }
    if (c.background) {
      style.background = c.background;
    }
    if (c.bold !== null && c.bold !== undefined) {
      style.bold = c.bold;
    }
  }
  return style;
}
