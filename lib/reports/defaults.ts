import type {
  ReportChartOptions,
  ReportDataSource,
  ReportDefinition,
  ReportElement,
  ReportElementStyle,
  ReportElementType,
  ReportPage,
  ReportTableOptions,
} from "@/lib/models/reports";

export const DEFAULT_FONT = "Inter, Segoe UI, DejaVu Sans, Arial, sans-serif";

/** System font stacks: they depend on what is installed where the report is viewed or rendered. */
export const FONT_FAMILIES = [
  { label: "System sans serif", value: "Segoe UI, DejaVu Sans, Arial, sans-serif" },
  { label: "System serif", value: "Georgia, DejaVu Serif, Times New Roman, serif" },
  { label: "System monospace", value: "Consolas, DejaVu Sans Mono, monospace" },
];

export const DEFAULT_PALETTE = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7", "#ec4899", "#84cc16", "#14b8a6", "#f97316"];

/** Portrait sizes in CSS px at 96 DPI. */
export const PAGE_PRESETS: Record<string, { width: number; height: number; label: string }> = {
  A4: { width: 794, height: 1123, label: "A4" },
  A3: { width: 1123, height: 1587, label: "A3" },
  Letter: { width: 816, height: 1056, label: "US Letter" },
  Legal: { width: 816, height: 1344, label: "US Legal" },
  Dashboard: { width: 1080, height: 1920, label: "Dashboard 16:9" },
};

export const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().replace(/-/g, "")
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export const defaultStyle = (overrides: Partial<ReportElementStyle> = {}): ReportElementStyle => ({
  fontSize: 14,
  fontFamily: DEFAULT_FONT,
  fontWeight: "normal",
  italic: false,
  underline: false,
  color: "#111827",
  textAlign: "left",
  verticalAlign: "top",
  lineHeight: 1.3,
  background: null,
  borderColor: null,
  borderWidth: 0,
  borderStyle: "solid",
  borderRadius: 0,
  padding: 0,
  ...overrides,
});

export const defaultTableOptions = (): ReportTableOptions => ({
  showHeader: true,
  headerBackground: "#f3f4f6",
  headerColor: "#111827",
  stripeBackground: "#f9fafb",
  gridColor: "#e5e7eb",
  rowHeight: 26,
  maxRows: null,
});

export const defaultChartOptions = (kind: ReportChartOptions["kind"] = "bar"): ReportChartOptions => ({
  kind,
  categoryField: null,
  categoryFormat: null,
  series: [],
  valueFormat: null,
  stacked: false,
  showLegend: true,
  showGrid: true,
  showValues: false,
  showAxes: true,
  axisColor: "#6b7280",
  gridColor: "#e5e7eb",
  palette: null,
});

export interface ToolboxItem {
  key: string;
  type: ReportElementType;
  label: string;
  create: () => Omit<ReportElement, "id" | "x" | "y">;
}

const cardStyle = {
  borderColor: "#e5e7eb",
  borderWidth: 1,
  borderRadius: 12,
  padding: 12,
  fontSize: 12,
};

export const TOOLBOX: ToolboxItem[] = [
  {
    key: "heading",
    type: "text",
    label: "Heading",
    create: () => ({
      type: "text",
      width: 360,
      height: 44,
      opacity: 1,
      text: "{{report.name}}",
      style: defaultStyle({ fontSize: 28, fontWeight: "bold" }),
    }),
  },
  {
    key: "text",
    type: "text",
    label: "Text",
    create: () => ({
      type: "text",
      width: 260,
      height: 48,
      opacity: 1,
      text: "Text",
      style: defaultStyle(),
    }),
  },
  {
    key: "metric",
    type: "metric",
    label: "Metric",
    create: () => ({
      type: "metric",
      width: 220,
      height: 96,
      opacity: 1,
      label: "Metric",
      style: defaultStyle({
        fontSize: 30,
        fontWeight: "bold",
        background: "#f5f3ff",
        borderRadius: 12,
        padding: 14,
        verticalAlign: "middle",
      }),
    }),
  },
  {
    key: "table",
    type: "table",
    label: "Table",
    create: () => ({
      type: "table",
      width: 520,
      height: 260,
      opacity: 1,
      columns: [],
      table: defaultTableOptions(),
      style: defaultStyle({
        fontSize: 12,
        borderColor: "#e5e7eb",
        borderWidth: 1,
        borderRadius: 8,
      }),
    }),
  },
  {
    key: "bar",
    type: "chart",
    label: "Bar chart",
    create: () => ({
      type: "chart",
      width: 440,
      height: 260,
      opacity: 1,
      chart: defaultChartOptions("bar"),
      style: defaultStyle(cardStyle),
    }),
  },
  {
    key: "line",
    type: "chart",
    label: "Line chart",
    create: () => ({
      type: "chart",
      width: 440,
      height: 260,
      opacity: 1,
      chart: defaultChartOptions("line"),
      style: defaultStyle(cardStyle),
    }),
  },
  {
    key: "pie",
    type: "chart",
    label: "Pie chart",
    create: () => ({
      type: "chart",
      width: 300,
      height: 260,
      opacity: 1,
      chart: defaultChartOptions("donut"),
      style: defaultStyle(cardStyle),
    }),
  },
  {
    key: "image",
    type: "image",
    label: "Image",
    create: () => ({
      type: "image",
      width: 160,
      height: 120,
      opacity: 1,
      fit: "contain",
      src: null,
      style: defaultStyle(),
    }),
  },
  {
    key: "rect",
    type: "shape",
    label: "Rectangle",
    create: () => ({
      type: "shape",
      shape: "rect",
      width: 180,
      height: 100,
      opacity: 1,
      style: defaultStyle({ background: "#e0e7ff", borderRadius: 8 }),
    }),
  },
  {
    key: "ellipse",
    type: "shape",
    label: "Ellipse",
    create: () => ({
      type: "shape",
      shape: "ellipse",
      width: 120,
      height: 120,
      opacity: 1,
      style: defaultStyle({ background: "#fde68a" }),
    }),
  },
  {
    key: "divider",
    type: "line",
    label: "Line",
    create: () => ({
      type: "line",
      width: 260,
      height: 12,
      opacity: 1,
      style: defaultStyle({ borderColor: "#9ca3af", borderWidth: 2 }),
    }),
  },
];

export const newPage = (name: string): ReportPage => ({ id: newId(), name, elements: [] });

export const newDataSource = (name: string, dataset = "activity"): ReportDataSource => ({
  id: newId(),
  name,
  dataset,
  engine: "efcore",
  filter: { combinator: "and", rules: [] },
  gridifyFilter: null,
  fields: [],
  groupBy: [],
  aggregates: [],
  sort: [],
  limit: 1000,
});

export const emptyDefinition = (): ReportDefinition => ({
  version: 1,
  page: {
    size: "A4",
    orientation: "portrait",
    width: 794,
    height: 1123,
    margin: 32,
    background: "#ffffff",
  },
  pages: [newPage("Page 1")],
  dataSources: [],
  parameters: [],
});

/** Fills in anything missing from older or hand-written definitions so the designer can rely on every field. */
export function normalizeDefinition(input: Partial<ReportDefinition> | null | undefined): ReportDefinition {
  const base = emptyDefinition();
  const def: ReportDefinition = {
    version: input?.version ?? 1,
    page: { ...base.page, ...(input?.page ?? {}) },
    pages: input?.pages?.length ? input.pages : base.pages,
    dataSources: (input?.dataSources ?? []).map((d) => ({
      ...newDataSource(d.name ?? "Data source"),
      ...d,
      fields: d.fields ?? [],
      groupBy: d.groupBy ?? [],
      aggregates: d.aggregates ?? [],
      sort: d.sort ?? [],
    })),
    parameters: input?.parameters ?? [],
  };
  def.pages = def.pages.map((p) => ({
    id: p.id || newId(),
    name: p.name || "Page",
    elements: (p.elements ?? []).map((e) => ({
      ...e,
      id: e.id || newId(),
      opacity: e.opacity ?? 1,
      style: defaultStyle(e.style ?? {}),
      table: e.type === "table" ? { ...defaultTableOptions(), ...(e.table ?? {}) } : e.table,
      chart: e.type === "chart" ? { ...defaultChartOptions(), ...(e.chart ?? {}) } : e.chart,
    })),
  }));
  return def;
}

/** A starting point that shows off each element type against the activity dataset. */
export function activitySummaryTemplate(): ReportDefinition {
  const activityFilter = {
    combinator: "and" as const,
    rules: [{ field: "DateCreated", operator: "lastNDays", parameter: "days" }],
  };
  const totals: ReportDataSource = {
    ...newDataSource("Totals"),
    filter: activityFilter,
    aggregates: [
      { fn: "count", alias: "plays" },
      { fn: "sum", field: "Duration", alias: "watch" },
      { fn: "countDistinct", field: "UserId", alias: "users" },
    ],
  };
  const daily: ReportDataSource = {
    ...newDataSource("Daily"),
    filter: activityFilter,
    groupBy: [{ field: "DateCreated", bucket: "day", alias: "day" }],
    aggregates: [
      { fn: "count", alias: "plays" },
      { fn: "sum", field: "Duration", alias: "watch" },
    ],
  };
  const users: ReportDataSource = {
    ...newDataSource("Top users"),
    filter: activityFilter,
    groupBy: [{ field: "UserName" }],
    aggregates: [{ fn: "count", alias: "plays" }],
    sort: [{ field: "plays", desc: true }],
    limit: 8,
  };
  const clients: ReportDataSource = {
    ...newDataSource("Clients"),
    filter: activityFilter,
    groupBy: [{ field: "Client" }],
    aggregates: [{ fn: "count", alias: "plays" }],
    sort: [{ field: "plays", desc: true }],
    limit: 8,
  };
  const recent: ReportDataSource = {
    ...newDataSource("Recent"),
    fields: ["DateCreated", "UserName", "Name", "Client", "Duration"],
    sort: [{ field: "DateCreated", desc: true }],
    limit: 12,
  };
  const metric = (id: string, x: number, field: string, label: string, background: string): ReportElement => ({
    id,
    type: "metric",
    x,
    y: 120,
    width: 230,
    height: 90,
    opacity: 1,
    dataSourceId: totals.id,
    valueField: field,
    label,
    style: defaultStyle({
      fontSize: 30,
      fontWeight: "bold",
      background,
      borderRadius: 12,
      padding: 14,
      verticalAlign: "middle",
    }),
  });
  const card = defaultStyle(cardStyle);

  return {
    version: 1,
    page: {
      size: "A4",
      orientation: "portrait",
      width: 794,
      height: 1123,
      margin: 32,
      background: "#ffffff",
    },
    parameters: [{ name: "days", label: "Days", type: "number", defaultValue: 30 }],
    dataSources: [totals, daily, users, clients, recent],
    pages: [
      {
        id: newId(),
        name: "Overview",
        elements: [
          {
            id: newId(),
            type: "shape",
            shape: "rect",
            x: 0,
            y: 0,
            width: 794,
            height: 96,
            opacity: 1,
            name: "Header band",
            style: defaultStyle({ background: "#4f46e5" }),
          },
          {
            id: newId(),
            type: "text",
            x: 32,
            y: 22,
            width: 600,
            height: 36,
            opacity: 1,
            name: "Title",
            text: "{{report.name}}",
            style: defaultStyle({ fontSize: 26, fontWeight: "bold", color: "#ffffff" }),
          },
          {
            id: newId(),
            type: "text",
            x: 32,
            y: 58,
            width: 730,
            height: 22,
            opacity: 1,
            name: "Subtitle",
            text: "Last {{param.days}} days · generated {{now|datetime}} UTC",
            style: defaultStyle({ fontSize: 13, color: "#e0e7ff" }),
          },
          metric(newId(), 32, "plays", "Plays", "#f5f3ff"),
          metric(newId(), 282, "watch", "Watch time", "#ecfdf5"),
          metric(newId(), 532, "users", "Active users", "#fff7ed"),
          {
            id: newId(),
            type: "chart",
            x: 32,
            y: 236,
            width: 730,
            height: 250,
            opacity: 1,
            name: "Daily plays",
            dataSourceId: daily.id,
            chart: {
              ...defaultChartOptions("area"),
              categoryField: "day",
              series: [{ field: "plays", label: "Plays" }],
              showLegend: false,
            },
            style: card,
          },
          {
            id: newId(),
            type: "chart",
            x: 32,
            y: 506,
            width: 355,
            height: 240,
            opacity: 1,
            name: "Top users",
            dataSourceId: users.id,
            chart: {
              ...defaultChartOptions("horizontalBar"),
              categoryField: "UserName",
              series: [{ field: "plays", label: "Plays" }],
              showValues: true,
              showLegend: false,
            },
            style: card,
          },
          {
            id: newId(),
            type: "chart",
            x: 407,
            y: 506,
            width: 355,
            height: 240,
            opacity: 1,
            name: "Clients",
            dataSourceId: clients.id,
            chart: {
              ...defaultChartOptions("donut"),
              categoryField: "Client",
              series: [{ field: "plays" }],
              showValues: true,
            },
            style: card,
          },
          {
            id: newId(),
            type: "table",
            x: 32,
            y: 770,
            width: 730,
            height: 320,
            opacity: 1,
            name: "Recent plays",
            dataSourceId: recent.id,
            columns: [
              {
                field: "DateCreated",
                header: "When",
                width: 1.3,
                align: "left",
                format: "datetime",
              },
              { field: "UserName", header: "User", width: 1, align: "left" },
              { field: "Name", header: "Title", width: 2, align: "left" },
              { field: "Client", header: "Client", width: 1, align: "left" },
              { field: "Duration", header: "Watched", width: 1, align: "right" },
            ],
            table: { ...defaultTableOptions(), rowHeight: 24 },
            style: defaultStyle({
              fontSize: 12,
              borderColor: "#e5e7eb",
              borderWidth: 1,
              borderRadius: 8,
            }),
          },
        ],
      },
    ],
  };
}
