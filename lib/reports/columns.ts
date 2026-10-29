import type {
  ReportTransform,
  FieldType,
  ReportCapabilities,
  ReportColumn,
  ReportDataSource,
  ReportFieldInfo,
  ReportCalculatedField,
} from "@/lib/models/reports";

export const groupOutputName = (g: { field: string; bucket?: string | null; alias?: string | null }) =>
  g.alias?.trim() || (g.bucket ? `${g.field}_${g.bucket}` : g.field);

export const aggregateOutputName = (a: { fn: string; field?: string | null; alias?: string | null }) =>
  a.alias?.trim() || (a.field ? `${a.fn}_${a.field}` : a.fn);

export const isGrouped = (ds: ReportDataSource) => ds.groupBy.length > 0 || ds.aggregates.length > 0;

/**
 * A best guess at an expression's result type, for binding before the query has run (the server infers the real
 * one, and a preview shows it). A declared type always wins.
 */
export function guessExpressionType(
  expression: string,
  fields: { key?: string; name?: string; type: FieldType }[],
  declared?: string | null,
): FieldType {
  if (declared && declared !== "auto") {
    return declared as FieldType;
  }
  const expr = expression.trim();
  const same = fields.find((f) => (f.key ?? f.name ?? "").toLowerCase() === expr.toLowerCase());
  if (same) {
    return same.type;
  }
  if (expr.includes('"')) {
    return "string";
  }
  if (/(==|!=|>=|<=|[<>]|&&|\|\||^!|\b(Contains|StartsWith|EndsWith|HasValue)\b)/.test(expr) && !/^iif\s*\(/i.test(expr)) {
    return "boolean";
  }
  if (/\.(Year|Month|Day|Hour|Minute|DayOfWeek|DayOfYear)\b/.test(expr) && !/[*/+-]/.test(expr)) {
    return "integer";
  }
  if (/\.(AddDays|AddHours|AddMonths|AddYears|AddMinutes|Date)\b/.test(expr)) {
    return "date";
  }
  return "number";
}

/** A data source's dataset fields plus its calculated fields, the set filters/groups/values can use. */
export function sourceFields(
  dataset: { fields: ReportFieldInfo[] } | undefined | null,
  calculated: ReportCalculatedField[] | null | undefined,
): ReportFieldInfo[] {
  const fields = dataset?.fields ?? [];
  const calc = (calculated ?? [])
    .filter((c) => c.name.trim())
    .map((c): ReportFieldInfo => {
      const type = guessExpressionType(c.expression, fields, c.type);
      return {
        key: c.name.trim(),
        label: c.label?.trim() || c.name.trim(),
        type,
        groupable: true,
        aggregatable: ["number", "integer", "duration", "bytes", "date"].includes(type),
        nullable: true,
        description: c.expression,
      };
    });
  return [...fields, ...calc];
}

/**
 * The columns a data source will return, worked out from its definition (same naming as ReportGrouping on the
 * server), so elements can be bound before the query has run. `all` is the report's data sources, which a
 * combined source's columns come from.
 */
export function dataSourceColumns(
  ds: ReportDataSource | undefined | null,
  caps: ReportCapabilities | null,
  all?: ReportDataSource[],
  seen: string[] = [],
): ReportColumn[] {
  if (!ds || !caps) {
    return [];
  }
  if (ds.derive) {
    return applyTransformColumns(derivedColumns(ds, caps, all ?? [], seen), ds.transforms ?? []).columns;
  }
  const dataset = caps.datasets.find((d) => d.key.toLowerCase() === ds.dataset.toLowerCase());
  if (!dataset) {
    return [];
  }
  const fields = sourceFields(dataset, ds.calculated);
  const field = (key?: string | null) => fields.find((f) => f.key.toLowerCase() === (key ?? "").toLowerCase());

  if (!isGrouped(ds)) {
    const keys = ds.fields.length ? ds.fields : fields.map((f) => f.key);
    const rowColumns = keys
      .map((k) => field(k))
      .filter((f) => !!f)
      .map((f) => ({ name: f!.key, label: f!.label, type: f!.type }));
    return applyTransformColumns(rowColumns, ds.transforms ?? []).columns;
  }

  const columns: ReportColumn[] = ds.groupBy.map((g) => {
    const f = field(g.field);
    const type: FieldType = g.bucket ? (g.bucket === "year" || g.bucket === "hourOfDay" ? "integer" : "string") : (f?.type ?? "string");
    return {
      name: groupOutputName(g),
      label: g.bucket ? `${f?.label ?? g.field} (${g.bucket})` : (f?.label ?? g.field),
      type,
    };
  });
  const aggregates = ds.aggregates.length === 0 && ds.groupBy.length > 0 ? [{ fn: "count", alias: "count" }] : ds.aggregates;
  for (const a of aggregates) {
    const f = field(a.field);
    let type: FieldType = "integer";
    if (a.fn !== "count" && a.fn !== "countDistinct") {
      type = a.fn === "avg" && f?.type === "integer" ? "number" : (f?.type ?? "number");
    }
    const label = a.fn === "count" && !a.field ? "Count" : `${a.fn} of ${f?.label ?? a.field}`;
    columns.push({ name: aggregateOutputName(a), label, type });
  }
  return applyTransformColumns(columns, ds.transforms ?? []).columns;
}

/** Same output as ReportDerivation on the server. */
function derivedColumns(ds: ReportDataSource, caps: ReportCapabilities, all: ReportDataSource[], seen: string[]): ReportColumn[] {
  const derive = ds.derive!;
  if (seen.includes(ds.id)) {
    return [];
  }
  const inputs = derive.sources.map((id) => all.find((d) => d.id === id)).filter((d): d is ReportDataSource => !!d);
  const columnsOf = (d: ReportDataSource) => dataSourceColumns(d, caps, all, [...seen, ds.id]);
  const has = (cols: ReportColumn[], name: string) => cols.some((c) => c.name.toLowerCase() === name.toLowerCase());

  if (derive.mode === "join") {
    if (inputs.length !== 2) {
      return [];
    }
    const [leftSource, rightSource] = inputs;
    const columns = [...columnsOf(leftSource)];
    const rightKeys = derive.on.map((k) => k.right.toLowerCase());
    const prefix = derive.rightPrefix ?? `${rightSource.name.replace(/[^A-Za-z0-9_]+/g, "_").replace(/^_+|_+$/g, "")}_`;
    for (const c of columnsOf(rightSource).filter((c) => !rightKeys.includes(c.name.toLowerCase()))) {
      const name = has(columns, c.name) ? prefix + c.name : c.name;
      columns.push({ name, label: name === c.name ? c.label : `${c.label} (${rightSource.name})`, type: c.type });
    }
    return columns;
  }

  const columns: ReportColumn[] = [];
  const sourceColumn = derive.sourceColumn?.trim();
  if (sourceColumn) {
    columns.push({ name: sourceColumn, label: sourceColumn, type: "string" });
  }
  for (const input of inputs) {
    for (const c of columnsOf(input).filter((c) => !has(columns, c.name))) {
      columns.push(c);
    }
  }
  return columns;
}

const WINDOW_SUFFIX: Record<string, string> = { runningTotal: "running", percentOfTotal: "pct", rank: "rank", change: "change" };

/**
 * The columns left after post-query steps (same naming as ReportTransforms on the server). A pivot's columns come
 * from the data, so after one only its row column is known and `unknown` is set: use a preview's columns then.
 */
export function applyTransformColumns(input: ReportColumn[], transforms: ReportTransform[]): { columns: ReportColumn[]; unknown: boolean } {
  let columns = [...input];
  let unknown = false;
  for (const t of transforms) {
    if (t.type === "calculate") {
      const name = t.alias?.trim();
      if (name) {
        const type = guessExpressionType(t.expression ?? "", columns, t.mode);
        columns = [...columns.filter((c) => c.name !== name), { name, label: name, type }];
      }
    } else if (t.type === "pivot") {
      const row = columns.find((c) => c.name === t.rowField);
      columns = row ? [row] : [];
      unknown = true;
    } else if (WINDOW_SUFFIX[t.type]) {
      const field = columns.find((c) => c.name === t.field);
      if (!field) {
        continue;
      }
      const name = t.alias?.trim() || `${field.name}_${WINDOW_SUFFIX[t.type]}`;
      const type: FieldType =
        t.type === "rank" ? "integer" : t.type === "percentOfTotal" || (t.type === "change" && t.mode === "percent") ? "number" : field.type;
      columns = [...columns.filter((c) => c.name !== name), { name, label: name, type }];
    }
  }
  return { columns, unknown };
}
