import type { FieldType, ReportCapabilities, ReportColumn, ReportDataSource } from "@/lib/models/reports";

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
    return keys
      .map((k) => field(k))
      .filter((f) => !!f)
      .map((f) => ({ name: f!.key, label: f!.label, type: f!.type }));
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
  return columns;
}
