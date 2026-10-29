// Mirrors Models/Reports in JellyStat-API-Core. The definition is shared by every renderer (designer, viewer,
// server SVG/HTML/PNG/PDF), so keep both sides in sync. Coordinates and sizes are CSS px at 96 DPI.

export type ReportElementType = "text" | "metric" | "table" | "chart" | "image" | "shape" | "line" | "cards";
export type ChartKind = "bar" | "horizontalBar" | "line" | "area" | "pie" | "donut";
export type QueryEngine = "efcore" | "gridify";
export type FieldType = "string" | "number" | "integer" | "boolean" | "date" | "duration" | "bytes" | "enum";
export type ExportFormat = "json" | "svg" | "html" | "png" | "pdf";
export type WebhookType = "generic" | "discord" | "json";

export interface ReportDefinition {
  version: number;
  page: ReportPageSettings;
  pages: ReportPage[];
  dataSources: ReportDataSource[];
  parameters: ReportParameter[];
  /** IANA time zone for date buckets, relative date filters and displayed dates; null = UTC. */
  timeZone?: string | null;
}

export interface ReportPageSettings {
  size: string;
  orientation: "portrait" | "landscape";
  width: number;
  height: number;
  margin: number;
  background: string;
}

export interface ReportPage {
  id: string;
  name: string;
  /** Paint order: later elements are drawn on top. */
  elements: ReportElement[];
}

export interface ReportElementStyle {
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  italic: boolean;
  underline: boolean;
  color: string;
  textAlign: "left" | "center" | "right";
  verticalAlign: "top" | "middle" | "bottom";
  lineHeight: number;
  background?: string | null;
  borderColor?: string | null;
  borderWidth: number;
  borderStyle: "solid" | "dashed" | "dotted";
  borderRadius: number;
  padding: number;
}

export interface ReportElement {
  id: string;
  type: ReportElementType;
  name?: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  hidden?: boolean;
  locked?: boolean;
  opacity: number;
  style: ReportElementStyle;
  text?: string | null;
  dataSourceId?: string | null;
  valueField?: string | null;
  label?: string | null;
  format?: string | null;
  prefix?: string | null;
  suffix?: string | null;
  columns?: ReportTableColumn[] | null;
  table?: ReportTableOptions | null;
  chart?: ReportChartOptions | null;
  src?: string | null;
  fit?: "contain" | "cover" | "fill" | null;
  shape?: "rect" | "ellipse" | null;
  /** image: a picture from the media server instead of src (also included in server exports). */
  media?: ReportImageBinding | null;
  /** text, image: link target; metric with the "link" format: URL template ({{value}}; empty uses the value). */
  link?: string | null;
  /** table, cards: rows that don't fit continue on extra pages added after this page. */
  grow?: boolean;
  /** Where a growing element starts on those extra pages (px from the top); its bottom edge stays put. */
  continueTop?: number | null;
  /** Also draw this element on the extra pages growing elements add (titles, footers, page numbers). */
  repeat?: boolean;
  /** table, cards, metric: styles for rows (or cells) that match. */
  conditions?: ReportCondition[] | null;
  cards?: ReportCardOptions | null;
}

export interface ReportCondition {
  field: string;
  operator: string;
  value?: unknown;
  /** table: the column to style; empty styles the whole row. */
  target?: string | null;
  color?: string | null;
  background?: string | null;
  bold?: boolean | null;
}

export interface ReportCardOptions {
  columns: number;
  cardHeight: number;
  gap: number;
  /** Column with the media item (or user) id of the picture; empty for none. */
  imageField?: string | null;
  imageKind: "item" | "user";
  imageType: "Primary" | "Backdrop";
  imagePosition: "top" | "left" | "none";
  /** The picture's share of the card height (top) or width (left). */
  imageSize: number;
  /** Text lines with {{row.FIELD}} tokens. */
  title?: string | null;
  subtitle?: string | null;
  value?: string | null;
  cardBackground?: string | null;
  cardRadius: number;
  maxItems?: number | null;
}

export interface ReportTableColumn {
  field: string;
  header?: string | null;
  width: number;
  align: "left" | "center" | "right";
  format?: string | null;
  /** "link" format: URL template with {{value}} and {{row.FIELD}}; empty uses the cell value as the URL. */
  link?: string | null;
}

export interface ReportTableOptions {
  showHeader: boolean;
  headerBackground: string;
  headerColor: string;
  stripeBackground?: string | null;
  gridColor: string;
  rowHeight: number;
  maxRows?: number | null;
}

export interface ReportChartOptions {
  kind: ChartKind;
  categoryField?: string | null;
  categoryFormat?: string | null;
  series: ReportChartSeries[];
  valueFormat?: string | null;
  stacked: boolean;
  showLegend: boolean;
  showGrid: boolean;
  showValues: boolean;
  showAxes: boolean;
  axisColor: string;
  gridColor: string;
  palette?: string[] | null;
}

export interface ReportChartSeries {
  field: string;
  label?: string | null;
  color?: string | null;
}

export interface ReportParameter {
  name: string;
  label?: string | null;
  type: "string" | "number" | "date" | "boolean" | "lookup";
  /** lookup: the dropdown's choices are the distinct values of a data source column. */
  lookup?: ReportParameterLookup | null;
  defaultValue?: unknown;
}

export interface ReportDataSource {
  id: string;
  name: string;
  /** Unused when the source is built from other sources (derive). */
  dataset: string;
  engine: QueryEngine;
  filter?: ReportFilterNode | null;
  /** Raw Gridify syntax, Gridify engine only. */
  gridifyFilter?: string | null;
  fields: string[];
  groupBy: ReportGroupBy[];
  aggregates: ReportAggregate[];
  sort: ReportSort[];
  limit?: number | null;
  /** Steps applied to the query result, in order. */
  transforms?: ReportTransform[] | null;
  /** Row-level fields computed from an expression; usable like dataset fields. */
  calculated?: ReportCalculatedField[] | null;
  /** When set, the source combines other data sources' results instead of querying a dataset. */
  derive?: ReportDerive | null;
}

export interface ReportCalculatedField {
  name: string;
  label?: string | null;
  expression: string;
  /** Result type; empty to infer it from the expression. */
  type?: string | null;
}

export interface ReportJoinKey {
  left: string;
  right: string;
}

export interface ReportDerive {
  mode: "join" | "union";
  sources: string[];
  on: ReportJoinKey[];
  joinType?: "inner" | "left" | "full" | null;
  rightPrefix?: string | null;
  sourceColumn?: string | null;
}

export type ReportTransformType =
  | "filter"
  | "calculate"
  | "topN"
  | "pivot"
  | "runningTotal"
  | "percentOfTotal"
  | "rank"
  | "change"
  | "fillDates"
  | "sort"
  | "limit";

/** One post-query step; which properties apply depends on type (see ReportTransform on the server). */
export interface ReportTransform {
  type: ReportTransformType;
  field?: string | null;
  operator?: string | null;
  value?: unknown;
  parameter?: string | null;
  count?: number | null;
  desc?: boolean;
  partitionBy?: string | null;
  labelField?: string | null;
  otherLabel?: string | null;
  rowField?: string | null;
  columnField?: string | null;
  aggregate?: string | null;
  fillZero?: boolean;
  sortColumns?: boolean;
  alias?: string | null;
  /** change: "difference" | "percent"; calculate: the result type (empty to infer). */
  mode?: string | null;
  expression?: string | null;
  bucket?: string | null;
  sort?: ReportSort[] | null;
}

export interface ReportGroupBy {
  field: string;
  bucket?: string | null;
  alias?: string | null;
}

export interface ReportAggregate {
  fn: string;
  field?: string | null;
  alias?: string | null;
}

export interface ReportSort {
  field: string;
  desc: boolean;
}

/** A group when `rules` is set, otherwise a rule. */
export interface ReportFilterNode {
  combinator?: "and" | "or" | null;
  not?: boolean;
  rules?: ReportFilterNode[] | null;
  field?: string | null;
  operator?: string | null;
  value?: unknown;
  valueTo?: unknown;
  parameter?: string | null;
}

export interface ReportColumn {
  name: string;
  label: string;
  type: FieldType;
}

export interface ReportDataResult {
  dataSourceId: string;
  columns: ReportColumn[];
  rows: Record<string, unknown>[];
  truncated: boolean;
  error?: string | null;
  elapsedMs: number;
}

export interface ReportRenderModel {
  reportId?: string | null;
  name: string;
  definition: ReportDefinition;
  data: Record<string, ReportDataResult>;
  parameters: Record<string, unknown>;
  generatedAt: string;
  /** Pages as drawn: design pages plus the extra pages growing tables and card grids need (from the server). */
  layout?: ReportLayoutPage[];
}

export interface ReportLayoutPage {
  /** Index of the design page. */
  page: number;
  /** 0 for the design page itself, 1+ for extra pages after it. */
  continuation: number;
  /** Growing elements on this page, by element id. */
  slices: Record<string, ReportSlice>;
}

export interface ReportSlice {
  start: number;
  count: number;
  y: number;
  height: number;
}

export interface ReportFieldInfo {
  key: string;
  label: string;
  type: FieldType;
  groupable: boolean;
  aggregatable: boolean;
  /** Can be empty, so isNull/isNotNull apply. */
  nullable: boolean;
  description?: string | null;
  options?: string[] | null;
}

export interface ReportDatasetInfo {
  key: string;
  label: string;
  description: string;
  fields: ReportFieldInfo[];
}

export interface ReportCapabilities {
  datasets: ReportDatasetInfo[];
  engines: QueryEngine[];
  operators: string[];
  aggregates: string[];
  dateBuckets: string[];
  formats: string[];
  exportFormats: ExportFormat[];
  webhookTypes: WebhookType[];
  transformTypes: ReportTransformType[];
  deriveModes?: string[];
  maxRows: number;
}

export interface ReportSummary {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  scheduleCount: number;
}

export interface ReportDetail extends ReportSummary {
  definition: ReportDefinition;
}

export interface SaveReport {
  id?: string | null;
  name: string;
  description?: string | null;
  definition: ReportDefinition;
}

export interface ReportSchedule {
  id?: string | null;
  reportId: string;
  name: string;
  enabled: boolean;
  serverId?: string | null;
  intervalMinutes: number;
  format: ExportFormat;
  webhookUrl: string;
  webhookType: WebhookType;
  /** On save: undefined/null keeps the stored secret, "" removes it. Never returned by the API. */
  webhookSecret?: string | null;
  hasSecret?: boolean;
  message?: string | null;
  parameters?: Record<string, unknown> | null;
  lastRunAt?: string | null;
  nextRunAt?: string | null;
  lastSuccess?: boolean | null;
  lastError?: string | null;
}

export interface ReportDeliveryResult {
  success: boolean;
  error?: string | null;
  fileName?: string | null;
  elapsedMs: number;
}

export interface ReportRenderRequest {
  reportId?: string | null;
  definition?: ReportDefinition | null;
  name?: string | null;
  format: ExportFormat;
  page?: number | null;
  scale?: number | null;
  parameters?: Record<string, unknown> | null;
  serverId?: string | null;
}

export interface ReportDeliverRequest {
  reportId?: string | null;
  definition?: ReportDefinition | null;
  name?: string | null;
  webhookUrl: string;
  webhookType: WebhookType;
  webhookSecret?: string | null;
  format: ExportFormat;
  message?: string | null;
  parameters?: Record<string, unknown> | null;
  serverId?: string | null;
}

export interface ReportParameterLookup {
  dataSourceId: string;
  /** Column whose value is passed to filters. */
  valueField: string;
  /** Column shown in the dropdown; defaults to valueField. */
  labelField?: string | null;
  /** Several choices: the value becomes an array and equals/does-not-equal rules match any of them. */
  multiple?: boolean;
}

export interface ReportParameterOption {
  value: unknown;
  label: string;
}

/** An image from the media server; the id comes from parameter, else the first row of dataSourceId's field, else id. */
export interface ReportImageBinding {
  type: "item" | "user";
  imageType: "Primary" | "Backdrop";
  id?: string | null;
  dataSourceId?: string | null;
  field?: string | null;
  parameter?: string | null;
}

/** A font bundled with the API; the server renders exports with the same files the browser loads. */
export interface ReportFontFamily {
  family: string;
  category: "sans-serif" | "serif" | "monospace" | "display";
  files: { file: string; weight: number; italic: boolean }[];
}
