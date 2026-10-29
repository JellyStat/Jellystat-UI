import type { ReportTransform, FieldType, ReportCapabilities, ReportColumn, ReportDataSource } from "@/lib/models/reports";

export const groupOutputName = (g: { field: string; bucket?: string | null; alias?: string | null }) =>
  g.alias?.trim() || (g.bucket ? `${g.field}_${g.bucket}` : g.field);

export const aggregateOutputName = (a: { fn: string; field?: string | null; alias?: string | null }) =>
  a.alias?.trim() || (a.field ? `${a.fn}_${a.field}` : a.fn);

export const isGrouped = (ds: ReportDataSource) => ds.groupBy.length > 0 || ds.aggregates.length > 0;

/**
 * The columns a data source will return, worked out from its definition (same naming as ReportGrouping on the
 * server), so elements can be bound before the query has run.
 */
export function dataSourceColumns(ds: ReportDataSource | undefined | null, caps: ReportCapabilities | null): ReportColumn[] {
  if (!ds || !caps) {
    return [];
  }
  const dataset = caps.datasets.find((d) => d.key.toLowerCase() === ds.dataset.toLowerCase());
  if (!dataset) {
    return [];
  }
  const field = (key?: string | null) => dataset.fields.find((f) => f.key.toLowerCase() === (key ?? "").toLowerCase());

  if (!isGrouped(ds)) {
    const keys = ds.fields.length ? ds.fields : dataset.fields.map((f) => f.key);
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

const WINDOW_SUFFIX: Record<string, string> = { runningTotal: "running", percentOfTotal: "pct", rank: "rank", change: "change" };

/**
 * The columns left after post-query steps (same naming as ReportTransforms on the server). A pivot's columns come
 * from the data, so after one only its row column is known and `unknown` is set: use a preview's columns then.
 */
export function applyTransformColumns(input: ReportColumn[], transforms: ReportTransform[]): { columns: ReportColumn[]; unknown: boolean } {
  let columns = [...input];
  let unknown = false;
  for (const t of transforms) {
    if (t.type === "pivot") {
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
