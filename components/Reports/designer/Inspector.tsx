import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignHorizontalDistributeCenter,
  AlignStartHorizontal,
  AlignStartVertical,
  AlignVerticalDistributeCenter,
  ArrowDown,
  ArrowDownToLine,
  ArrowUp,
  ArrowUpToLine,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { type ReactNode, useContext, useRef } from "react";
import { toast } from "sonner";
import i18next from "i18next";
import type { ReportChartOptions, ReportElement, ReportElementStyle, ReportTableColumn, ReportTableOptions } from "@/lib/models/reports";
import { dataSourceColumns } from "@/lib/reports/columns";
import { DEFAULT_PALETTE, defaultChartOptions, defaultTableOptions, PAGE_PRESETS } from "@/lib/reports/defaults";
import { TOKEN_HELP, VALUE_FORMATS } from "@/lib/reports/format";
import { ColorInput, Field, NumberInput, PreviewDataContext, Section, Select, TextInput, Toggle, ToolButton, useCapabilities } from "./controls";
import { useDesigner } from "./designerStore";
import { CardsSection, ConditionsSection, PagesSection } from "./FlowSettings";
import FontPicker from "./FontPicker";
import { dt } from "./i18n";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const formatOptions = VALUE_FORMATS.map((f) => ({
  value: f,
  label: f === "auto" ? dt("reports.designer.automatic", "Automatic") : f === "link" ? dt("reports.designer.hyperlink", "Hyperlink") : f.charAt(0).toUpperCase() + f.slice(1),
}));
// Charts can't link their labels
const chartFormatOptions = formatOptions.filter((f) => f.value !== "link");

const LINK_HELP =
  "Use {{value}} for the value and {{row.FIELD}} for other columns, e.g. https://jellyfin.example/web/#/details?id={{row.ItemId}}. Empty uses the value itself as the URL. Only http, https and mailto links work.";

/** Link target for a text or image element. */
function ElementLink({ e }: { e: ReportElement }) {
  const { updateElements } = useDesigner();
  return (
    <Field label={dt("reports.designer.link_optional", "Link (optional)")} hint={dt("reports.designer.opens_when_clicked_in_the_viewer_html_svg_and_pd", "Opens when clicked in the viewer, HTML/SVG and PDF exports; {{tokens}} work here")}>
      <TextInput
        value={e.link ?? ""}
        placeholder="https://..."
        onChange={(v) =>
          updateElements(
            [e.id],
            (x) => {
              x.link = v || null;
            },
            `link-${e.id}`,
          )
        }
      />
    </Field>
  );
}

function TokenHelp() {
  return (
    <details className="text-xs text-gray-500">
      <summary className="cursor-pointer hover:text-gray-200">{dt("reports.designer.placeholders", "Placeholders")}</summary>
      <ul className="mt-1 space-y-0.5">
        {TOKEN_HELP.map((t) => (
          <li key={t.token}>
            <code className="text-gray-300">{t.token}</code> {t.description}
          </li>
        ))}
      </ul>
    </details>
  );
}

function PageSetup() {
  const { definition, page, state, change } = useDesigner();
  const p = definition.page;
  const setPage = (patch: Partial<typeof p>, key: string) =>
    change(
      (doc) => {
        Object.assign(doc.definition.page, patch);
      },
      { coalesceKey: `page-${key}` },
    );

  return (
    <>
      <ReportInfo />
      <Section title={dt("reports.designer.page_setup", "Page setup")}>
        <div className="grid grid-cols-2 gap-2">
          <Field label={dt("common.size", "Size")}>
            <Select
              value={PAGE_PRESETS[p.size] ? p.size : "Custom"}
              options={[...Object.entries(PAGE_PRESETS).map(([k, v]) => ({ value: k, label: v.label })), { value: "Custom", label: dt("common.custom", "Custom") }]}
              onChange={(size) => {
                const preset = PAGE_PRESETS[size];
                if (!preset) {
                  setPage({ size }, "size");
                  return;
                }
                const landscape = p.orientation === "landscape";
                setPage(
                  {
                    size,
                    width: landscape ? preset.height : preset.width,
                    height: landscape ? preset.width : preset.height,
                  },
                  "size",
                );
              }}
            />
          </Field>
          <Field label={dt("reports.designer.orientation", "Orientation")}>
            <Select
              value={p.orientation}
              options={[
                { value: "portrait", label: dt("reports.designer.portrait", "Portrait") },
                { value: "landscape", label: dt("reports.designer.landscape", "Landscape") },
              ]}
              onChange={(orientation) => {
                if (orientation !== p.orientation) {
                  setPage({ orientation, width: p.height, height: p.width }, "orientation");
                }
              }}
            />
          </Field>
          <Field label={dt("reports.designer.width_px", "Width (px)")}>
            <NumberInput value={p.width} min={50} max={5000} onChange={(v) => setPage({ width: v ?? p.width, size: "Custom" }, "width")} />
          </Field>
          <Field label={dt("reports.designer.height_px", "Height (px)")}>
            <NumberInput value={p.height} min={50} max={5000} onChange={(v) => setPage({ height: v ?? p.height, size: "Custom" }, "height")} />
          </Field>
          <Field label={dt("reports.designer.margin_guide", "Margin guide")}>
            <NumberInput value={p.margin} min={0} max={500} onChange={(v) => setPage({ margin: v ?? 0 }, "margin")} />
          </Field>
          <Field label={dt("reports.designer.background", "Background")}>
            <ColorInput value={p.background} onChange={(v) => setPage({ background: v ?? "#ffffff" }, "background")} />
          </Field>
        </div>
        <Field label={dt("reports.designer.this_page_s_name", "This page's name")}>
          <TextInput
            value={page.name}
            onChange={(v) =>
              change(
                (doc, s) => {
                  doc.definition.pages[s.pageIndex].name = v;
                },
                { coalesceKey: `page-name-${state.pageIndex}` },
              )
            }
          />
        </Field>
      </Section>
    </>
  );
}

const TIME_ZONES: string[] = (() => {
  try {
    return (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.("timeZone") ?? [];
  } catch {
    return [];
  }
})();

function ReportInfo() {
  const { state, change } = useDesigner();
  return (
    <Section title={dt("reports.designer.report", "Report")}>
      <Field label={dt("common.name", "Name")}>
        <TextInput
          value={state.doc.name}
          onChange={(v) =>
            change(
              (doc) => {
                doc.name = v;
              },
              { coalesceKey: "report-name" },
            )
          }
        />
      </Field>
      <Field label={dt("reports.designer.time_zone", "Time zone")} hint={dt("reports.designer.used_for_date_groups_relative_date_filters_today", "Used for date groups, relative date filters (today, this month) and displayed dates")}>
        <Select
          value={state.doc.definition.timeZone ?? ""}
          placeholder={dt("reports.designer.utc", "UTC")}
          options={TIME_ZONES.map((z) => ({ value: z, label: z.replace(/_/g, " ") }))}
          onChange={(v) =>
            change((doc) => {
              doc.definition.timeZone = v || null;
            })
          }
        />
      </Field>
      <Field label={dt("reports.designer.description", "Description")}>
        <TextInput
          multiline
          value={state.doc.description}
          onChange={(v) =>
            change(
              (doc) => {
                doc.description = v;
              },
              { coalesceKey: "report-description" },
            )
          }
        />
      </Field>
    </Section>
  );
}

function Arrange() {
  const { selected, align, distribute, matchSize, reorder, deleteSelection } = useDesigner();
  const many = selected.length > 1;
  return (
    <div className="px-3 py-2 border-b border-border/60 space-y-1">
      <div className="flex flex-wrap gap-0.5">
        <ToolButton title={many ? dt("reports.designer.align_left_edges", "Align left edges") : dt("reports.designer.align_to_page_left", "Align to page left")} onClick={() => align("left")}>
          <AlignStartVertical size={15} />
        </ToolButton>
        <ToolButton title={dt("reports.designer.align_centres_horizontally", "Align centres horizontally")} onClick={() => align("center")}>
          <AlignCenterVertical size={15} />
        </ToolButton>
        <ToolButton title={dt("reports.designer.align_right_edges", "Align right edges")} onClick={() => align("right")}>
          <AlignEndVertical size={15} />
        </ToolButton>
        <ToolButton title={dt("reports.designer.align_top_edges", "Align top edges")} onClick={() => align("top")}>
          <AlignStartHorizontal size={15} />
        </ToolButton>
        <ToolButton title={dt("reports.designer.align_centres_vertically", "Align centres vertically")} onClick={() => align("middle")}>
          <AlignCenterHorizontal size={15} />
        </ToolButton>
        <ToolButton title={dt("reports.designer.align_bottom_edges", "Align bottom edges")} onClick={() => align("bottom")}>
          <AlignEndHorizontal size={15} />
        </ToolButton>
        <ToolButton title={dt("reports.designer.distribute_horizontally", "Distribute horizontally")} onClick={() => distribute("horizontal")} disabled={selected.length < 3}>
          <AlignHorizontalDistributeCenter size={15} />
        </ToolButton>
        <ToolButton title={dt("reports.designer.distribute_vertically", "Distribute vertically")} onClick={() => distribute("vertical")} disabled={selected.length < 3}>
          <AlignVerticalDistributeCenter size={15} />
        </ToolButton>
      </div>
      <div className="flex flex-wrap gap-0.5 items-center">
        <ToolButton title={dt("reports.designer.bring_to_front_ctrl_shift", "Bring to front (Ctrl+Shift+])")} onClick={() => reorder("front")}>
          <ArrowUpToLine size={15} />
        </ToolButton>
        <ToolButton title={dt("reports.designer.bring_forward_ctrl", "Bring forward (Ctrl+])")} onClick={() => reorder("forward")}>
          <ArrowUp size={15} />
        </ToolButton>
        <ToolButton title={dt("reports.designer.send_backward_ctrl", "Send backward (Ctrl+[)")} onClick={() => reorder("backward")}>
          <ArrowDown size={15} />
        </ToolButton>
        <ToolButton title={dt("reports.designer.send_to_back_ctrl_shift", "Send to back (Ctrl+Shift+[)")} onClick={() => reorder("back")}>
          <ArrowDownToLine size={15} />
        </ToolButton>
        {many && (
          <>
            <button
              type="button"
              className="text-xs px-1.5 py-1 rounded text-gray-400 hover:text-white hover:bg-surface-hover cursor-pointer"
              onClick={() => matchSize("width")}
            >
              {dt("reports.designer.same_width", "Same width")}
            </button>
            <button
              type="button"
              className="text-xs px-1.5 py-1 rounded text-gray-400 hover:text-white hover:bg-surface-hover cursor-pointer"
              onClick={() => matchSize("height")}
            >
              {dt("reports.designer.same_height", "Same height")}
            </button>
          </>
        )}
        <div className="flex-1" />
        <ToolButton title={dt("reports.designer.delete_del", "Delete (Del)")} onClick={deleteSelection} className="hover:text-danger!">
          <Trash2 size={15} />
        </ToolButton>
      </div>
    </div>
  );
}

function Layout({ e }: { e: ReportElement }) {
  const { updateElements } = useDesigner();
  const set = (key: keyof ReportElement, value: unknown) =>
    updateElements(
      [e.id],
      (x) => {
        (x as unknown as Record<string, unknown>)[key] = value;
      },
      `layout-${e.id}-${String(key)}`,
    );
  return (
    <Section title={dt("reports.designer.layout", "Layout")}>
      <Field label={dt("common.name", "Name")}>
        <TextInput value={e.name ?? ""} onChange={(v) => set("name", v || null)} />
      </Field>
      <div className="grid grid-cols-4 gap-1.5">
        <Field label="X">
          <NumberInput value={e.x} onChange={(v) => set("x", v ?? 0)} />
        </Field>
        <Field label="Y">
          <NumberInput value={e.y} onChange={(v) => set("y", v ?? 0)} />
        </Field>
        <Field label="W">
          <NumberInput value={e.width} min={1} onChange={(v) => set("width", v ?? 1)} />
        </Field>
        <Field label="H">
          <NumberInput value={e.height} min={1} onChange={(v) => set("height", v ?? 1)} />
        </Field>
      </div>
      <div className="flex items-center gap-3">
        <Field label={dt("reports.designer.opacity_percent", "Opacity %")} className="w-20">
          <NumberInput value={Math.round((e.opacity ?? 1) * 100)} min={0} max={100} onChange={(v) => set("opacity", (v ?? 100) / 100)} />
        </Field>
        <div className="flex flex-col gap-1 pt-3">
          <Toggle label={dt("reports.designer.locked", "Locked")} checked={!!e.locked} onChange={(v) => set("locked", v)} />
          <Toggle label={dt("reports.designer.hidden", "Hidden")} checked={!!e.hidden} onChange={(v) => set("hidden", v)} />
        </div>
      </div>
    </Section>
  );
}

function DataSourcePicker({ e }: { e: ReportElement }) {
  const { definition, updateElements } = useDesigner();
  return (
    <Field label={dt("reports.designer.data_source", "Data source")}>
      <Select
        value={e.dataSourceId ?? ""}
        placeholder={definition.dataSources.length ? dt("common.choose", "Choose") : dt("reports.designer.add_one_in_the_data_tab", "Add one in the Data tab")}
        options={definition.dataSources.map((d) => ({ value: d.id, label: d.name }))}
        onChange={(v) =>
          updateElements([e.id], (x) => {
            x.dataSourceId = v || null;
          })
        }
      />
    </Field>
  );
}

function useColumns(e: ReportElement) {
  const caps = useCapabilities();
  const { definition } = useDesigner();
  const result = useContext(PreviewDataContext)[e.dataSourceId ?? ""];
  // Columns from the last preview are exact (pivoted columns are only known from the data)
  if (result && !result.error && result.columns.length) {
    return result.columns;
  }
  return dataSourceColumns(
    definition.dataSources.find((d) => d.id === e.dataSourceId),
    caps,
    definition.dataSources,
  );
}

function CardsContent({ e }: { e: ReportElement }) {
  const columns = useColumns(e);
  return <CardsSection e={e} columns={columns} picker={<DataSourcePicker e={e} />} />;
}

function ConditionsContent({ e }: { e: ReportElement }) {
  const columns = useColumns(e);
  return <ConditionsSection e={e} columns={columns} />;
}

function MetricContent({ e }: { e: ReportElement }) {
  const { updateElements } = useDesigner();
  const columns = useColumns(e);
  const set = (key: "valueField" | "label" | "format" | "prefix" | "suffix" | "link", value: string | null) =>
    updateElements(
      [e.id],
      (x) => {
        x[key] = value;
      },
      `metric-${e.id}-${key}`,
    );
  return (
    <Section title={dt("reports.designer.metric", "Metric")}>
      <DataSourcePicker e={e} />
      <Field label={dt("common.value", "Value")}>
        <Select
          value={e.valueField ?? ""}
          placeholder={dt("reports.designer.choose_a_column", "Choose a column...")}
          options={columns.map((c) => ({ value: c.name, label: `${c.label} (${c.name})` }))}
          onChange={(v) => set("valueField", v || null)}
        />
      </Field>
      <Field label={dt("reports.designer.label", "Label")}>
        <TextInput value={e.label ?? ""} onChange={(v) => set("label", v || null)} />
      </Field>
      <div className="grid grid-cols-3 gap-1.5">
        <Field label={dt("reports.designer.format", "Format")}>
          <Select value={e.format ?? "auto"} options={formatOptions} onChange={(v) => set("format", v === "auto" ? null : v)} />
        </Field>
        <Field label={dt("reports.designer.prefix", "Prefix")}>
          <TextInput value={e.prefix ?? ""} onChange={(v) => set("prefix", v || null)} />
        </Field>
        <Field label={dt("reports.designer.suffix", "Suffix")}>
          <TextInput value={e.suffix ?? ""} onChange={(v) => set("suffix", v || null)} />
        </Field>
      </div>
      {e.format === "link" && (
        <Field label={dt("reports.designer.link_url", "Link URL")} hint={LINK_HELP}>
          <TextInput value={e.link ?? ""} placeholder="{{value}}" onChange={(v) => set("link", v || null)} />
        </Field>
      )}
      <p className="text-xs text-gray-500">{dt("reports.designer.shows_the_value_from_the_first_row_use_a_summary", "Shows the value from the first row. Use a Summary data source for totals.")}</p>
    </Section>
  );
}

/** A small label above one setting inside a table column card. */
function ColumnField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{label}</span>
      {children}
    </label>
  );
}

function TableContent({ e }: { e: ReportElement }) {
  const { updateElements } = useDesigner();
  const columns = useColumns(e);
  const t: ReportTableOptions = { ...defaultTableOptions(), ...(e.table ?? {}) };
  const cols = e.columns ?? [];
  const setCols = (next: ReportTableColumn[], key: string) =>
    updateElements(
      [e.id],
      (x) => {
        x.columns = next;
      },
      `table-cols-${e.id}-${key}`,
    );
  const setOpt = (patch: Partial<ReportTableOptions>, key: string) =>
    updateElements(
      [e.id],
      (x) => {
        x.table = { ...defaultTableOptions(), ...(x.table ?? {}), ...patch };
      },
      `table-${e.id}-${key}`,
    );

  return (
    <Section title={dt("reports.designer.table", "Table")}>
      <DataSourcePicker e={e} />
      <Field label={cols.length ? dt("reports.designer.columns_2", "Columns") : dt("reports.designer.columns_showing_all", "Columns (showing all)")}>
        <div className="space-y-2">
          {cols.map((c, i) => (
            <div key={i} className="rounded-lg border border-border bg-white/[0.02] overflow-hidden">
              <div className="flex items-center gap-1.5 px-1.5 py-1.5 bg-white/[0.04] border-b border-border">
                <span className="shrink-0 w-5 h-5 flex items-center justify-center rounded bg-primary/15 text-[10px] font-bold text-primary-soft">
                  {i + 1}
                </span>
                <Select
                  value={c.field}
                  options={columns.map((x) => ({ value: x.name, label: x.label }))}
                  onChange={(v) =>
                    setCols(
                      cols.map((x, j) => (j === i ? { ...x, field: v } : x)),
                      `${i}-field`,
                    )
                  }
                />
                <button
                  type="button"
                  className="shrink-0 p-1 text-gray-500 hover:text-danger cursor-pointer"
                  onClick={() =>
                    setCols(
                      cols.filter((_, j) => j !== i),
                      `${i}-del`,
                    )
                  }
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="grid grid-cols-[1fr_56px] gap-1.5 p-1.5">
                <ColumnField label={dt("reports.designer.header", "Header")}>
                  <TextInput
                    value={c.header ?? ""}
                    placeholder={dt("reports.designer.header", "Header")}
                    onChange={(v) =>
                      setCols(
                        cols.map((x, j) => (j === i ? { ...x, header: v || null } : x)),
                        `${i}-header`,
                      )
                    }
                  />
                </ColumnField>
                <ColumnField label={dt("reports.designer.width", "Width")}>
                  <NumberInput
                    value={c.width}
                    min={0.1}
                    step={0.1}
                    onChange={(v) =>
                      setCols(
                        cols.map((x, j) => (j === i ? { ...x, width: v ?? 1 } : x)),
                        `${i}-width`,
                      )
                    }
                  />
                </ColumnField>
              </div>
              <div className="grid grid-cols-2 gap-1.5 px-1.5 pb-1.5">
                <ColumnField label={dt("reports.designer.align", "Align")}>
                  <Select
                    value={c.align}
                    options={[
                      { value: "left", label: dt("reports.designer.left", "Left") },
                      { value: "center", label: dt("reports.designer.center", "Center") },
                      { value: "right", label: dt("reports.designer.right", "Right") },
                    ]}
                    onChange={(v) =>
                      setCols(
                        cols.map((x, j) => (j === i ? { ...x, align: v } : x)),
                        `${i}-align`,
                      )
                    }
                  />
                </ColumnField>
                <ColumnField label={dt("reports.designer.format", "Format")}>
                  <Select
                    value={c.format ?? "auto"}
                    options={formatOptions}
                    onChange={(v) =>
                      setCols(
                        cols.map((x, j) => (j === i ? { ...x, format: v === "auto" ? null : v } : x)),
                        `${i}-format`,
                      )
                    }
                  />
                </ColumnField>
              </div>
              {c.format === "link" && (
                <div title={LINK_HELP} className="px-1.5 pb-1.5">
                  <ColumnField label={dt("reports.designer.link_url", "Link URL")}>
                    <TextInput
                      value={c.link ?? ""}
                      placeholder={dt("reports.designer.link_url_e_g_https_site_item_row_id_empty_the_va", "Link URL, e.g. https://site/item/{{row.Id}} (empty: the value)")}
                      onChange={(v) =>
                        setCols(
                          cols.map((x, j) => (j === i ? { ...x, link: v || null } : x)),
                          `${i}-link`,
                        )
                      }
                    />
                  </ColumnField>
                </div>
              )}
            </div>
          ))}
          <div className="flex gap-2">
            <button
              type="button"
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white cursor-pointer"
              onClick={() => {
                const next = columns.find((x) => !cols.some((c) => c.field === x.name)) ?? columns[0];
                if (next) {
                  setCols(
                    [
                      ...cols,
                      {
                        field: next.name,
                        header: null,
                        width: 1,
                        align: next.type === "string" ? "left" : "right",
                        format: null,
                      },
                    ],
                    "add",
                  );
                }
              }}
            >
              <Plus size={12} /> {dt("reports.designer.column", "Column")}
            </button>
            {cols.length === 0 && columns.length > 0 && (
              <button
                type="button"
                className="text-xs text-gray-400 hover:text-white cursor-pointer"
                onClick={() =>
                  setCols(
                    columns.map((x) => ({
                      field: x.name,
                      header: null,
                      width: 1,
                      align: x.type === "string" ? "left" : "right",
                      format: null,
                    })),
                    "all",
                  )
                }
              >
                {dt("reports.designer.add_all", "Add all")}
              </button>
            )}
          </div>
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label={dt("reports.designer.row_height", "Row height")}>
          <NumberInput value={t.rowHeight} min={12} max={200} onChange={(v) => setOpt({ rowHeight: v ?? 26 }, "rowHeight")} />
        </Field>
        <Field label={dt("reports.designer.max_rows", "Max rows")}>
          <NumberInput value={t.maxRows ?? null} min={1} placeholder="fit" onChange={(v) => setOpt({ maxRows: v }, "maxRows")} />
        </Field>
        <Field label={dt("reports.designer.header_background", "Header background")}>
          <ColorInput value={t.headerBackground} onChange={(v) => setOpt({ headerBackground: v ?? "#f3f4f6" }, "hb")} />
        </Field>
        <Field label={dt("reports.designer.header_text", "Header text")}>
          <ColorInput value={t.headerColor} onChange={(v) => setOpt({ headerColor: v ?? "#111827" }, "hc")} />
        </Field>
        <Field label={dt("reports.designer.stripes", "Stripes")}>
          <ColorInput allowNone value={t.stripeBackground} onChange={(v) => setOpt({ stripeBackground: v }, "stripe")} />
        </Field>
        <Field label={dt("reports.designer.grid_lines", "Grid lines")}>
          <ColorInput value={t.gridColor} onChange={(v) => setOpt({ gridColor: v ?? "#e5e7eb" }, "grid")} />
        </Field>
      </div>
      <Toggle label={dt("reports.designer.show_header", "Show header")} checked={t.showHeader} onChange={(v) => setOpt({ showHeader: v }, "showHeader")} />
    </Section>
  );
}

function ChartContent({ e }: { e: ReportElement }) {
  const { updateElements } = useDesigner();
  const columns = useColumns(e);
  const c: ReportChartOptions = { ...defaultChartOptions(), ...(e.chart ?? {}) };
  const set = (patch: Partial<ReportChartOptions>, key: string) =>
    updateElements(
      [e.id],
      (x) => {
        x.chart = { ...defaultChartOptions(), ...(x.chart ?? {}), ...patch };
      },
      `chart-${e.id}-${key}`,
    );
  const numeric = columns.filter((x) => x.type !== "string" && x.type !== "date" && x.type !== "boolean" && x.type !== "enum");
  const pie = c.kind === "pie" || c.kind === "donut";

  return (
    <Section title={dt("reports.designer.chart", "Chart")}>
      <DataSourcePicker e={e} />
      <Field label={dt("common.type", "Type")}>
        <Select
          value={c.kind}
          options={[
            { value: "bar", label: dt("reports.designer.bar", "Bar") },
            { value: "horizontalBar", label: dt("reports.designer.horizontal_bar", "Horizontal bar") },
            { value: "line", label: dt("reports.designer.line", "Line") },
            { value: "area", label: dt("reports.designer.area", "Area") },
            { value: "pie", label: dt("reports.designer.pie", "Pie") },
            { value: "donut", label: dt("reports.designer.donut", "Donut") },
          ]}
          onChange={(v) => set({ kind: v }, "kind")}
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label={pie ? dt("reports.designer.slices", "Slices") : dt("reports.designer.categories_x", "Categories (X)")}>
          <Select
            value={c.categoryField ?? ""}
            placeholder={dt("common.choose", "Choose")}
            options={columns.map((x) => ({ value: x.name, label: x.label }))}
            onChange={(v) => set({ categoryField: v || null }, "category")}
          />
        </Field>
        <Field label={dt("reports.designer.category_format", "Category format")}>
          <Select
            value={c.categoryFormat ?? "auto"}
            options={chartFormatOptions}
            onChange={(v) => set({ categoryFormat: v === "auto" ? null : v }, "categoryFormat")}
          />
        </Field>
      </div>
      <Field label={pie ? dt("common.value", "Value") : dt("reports.designer.series_y", "Series (Y)")}>
        <div className="space-y-1.5">
          {c.series.map((s, i) => (
            <div key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] gap-1 items-center">
              <Select
                value={s.field}
                options={(numeric.length ? numeric : columns).map((x) => ({
                  value: x.name,
                  label: x.label,
                }))}
                onChange={(v) => set({ series: c.series.map((x, j) => (j === i ? { ...x, field: v } : x)) }, `s${i}f`)}
              />
              <TextInput
                value={s.label ?? ""}
                placeholder={dt("reports.designer.label", "Label")}
                onChange={(v) => set({ series: c.series.map((x, j) => (j === i ? { ...x, label: v || null } : x)) }, `s${i}l`)}
              />
              <input
                type="color"
                value={s.color || (c.palette?.length ? c.palette : DEFAULT_PALETTE)[i % DEFAULT_PALETTE.length]}
                onChange={(ev) =>
                  set(
                    {
                      series: c.series.map((x, j) => (j === i ? { ...x, color: ev.target.value } : x)),
                    },
                    `s${i}c`,
                  )
                }
                className="w-7 h-7 rounded border border-border bg-transparent cursor-pointer p-0.5"
                disabled={pie}
              />
              <button
                type="button"
                className="p-1 text-gray-500 hover:text-danger cursor-pointer"
                onClick={() => set({ series: c.series.filter((_, j) => j !== i) }, `s${i}del`)}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {(!pie || c.series.length === 0) && (
            <button
              type="button"
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white cursor-pointer"
              onClick={() => {
                const next = numeric.find((x) => !c.series.some((s) => s.field === x.name)) ?? numeric[0] ?? columns[0];
                if (next) {
                  set({ series: [...c.series, { field: next.name, label: null, color: null }] }, "add-series");
                }
              }}
            >
              <Plus size={12} /> {dt("reports.designer.series", "Series")}
            </button>
          )}
        </div>
      </Field>
      <Field label={dt("reports.designer.value_format", "Value format")}>
        <Select
          value={c.valueFormat ?? "auto"}
          options={chartFormatOptions}
          onChange={(v) => set({ valueFormat: v === "auto" ? null : v }, "valueFormat")}
        />
      </Field>
      <div className="grid grid-cols-2 gap-1.5">
        <Toggle label={dt("reports.designer.legend", "Legend")} checked={c.showLegend} onChange={(v) => set({ showLegend: v }, "legend")} />
        <Toggle label={dt("reports.designer.values", "Values")} checked={c.showValues} onChange={(v) => set({ showValues: v }, "values")} />
        {!pie && <Toggle label={dt("reports.designer.grid", "Grid")} checked={c.showGrid} onChange={(v) => set({ showGrid: v }, "grid")} />}
        {!pie && <Toggle label={dt("reports.designer.axes", "Axes")} checked={c.showAxes} onChange={(v) => set({ showAxes: v }, "axes")} />}
        {(c.kind === "bar" || c.kind === "horizontalBar" || c.kind === "area") && (
          <Toggle label={dt("reports.designer.stacked", "Stacked")} checked={c.stacked} onChange={(v) => set({ stacked: v }, "stacked")} />
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {/* Axis colour also colours the legend and value labels, so pie/donut need it too (as the legend colour). */}
        <Field label={pie ? dt("reports.designer.legend_colour", "Legend colour") : dt("reports.designer.axis_colour", "Axis colour")}>
          <ColorInput value={c.axisColor} onChange={(v) => set({ axisColor: v ?? "#6b7280" }, "axisColor")} />
        </Field>
        {!pie && (
          <Field label={dt("reports.designer.grid_colour", "Grid colour")}>
            <ColorInput value={c.gridColor} onChange={(v) => set({ gridColor: v ?? "#e5e7eb" }, "gridColor")} />
          </Field>
        )}
      </div>
    </Section>
  );
}

function MediaSettings({ e }: { e: ReportElement }) {
  const { definition, updateElements } = useDesigner();
  const caps = useCapabilities();
  const media = e.media!;
  const set = (patch: Partial<NonNullable<ReportElement["media"]>>, key: string) =>
    updateElements(
      [e.id],
      (x) => {
        x.media = { ...media, ...patch };
      },
      `media-${e.id}-${key}`,
    );
  const from = media.parameter ? "parameter" : media.dataSourceId ? "data" : "fixed";
  const columns = dataSourceColumns(
    definition.dataSources.find((d) => d.id === media.dataSourceId),
    caps,
    definition.dataSources,
  );

  return (
    <>
      <Field label={dt("reports.designer.picture", "Picture")}>
        <Select
          value={media.type === "user" ? "user" : media.imageType === "Backdrop" ? "backdrop" : "poster"}
          options={[
            { value: "poster", label: dt("reports.designer.item_poster", "Item poster") },
            { value: "backdrop", label: dt("reports.designer.item_backdrop", "Item backdrop") },
            { value: "user", label: dt("reports.designer.user_avatar", "User avatar") },
          ]}
          onChange={(v) => set({ type: v === "user" ? "user" : "item", imageType: v === "backdrop" ? "Backdrop" : "Primary" }, "kind")}
        />
      </Field>
      <Field label={media.type === "user" ? dt("reports.designer.user_id_from", "User id from") : dt("reports.designer.item_id_from", "Item id from")}>
        <Select
          value={from}
          options={[
            { value: "data", label: dt("reports.designer.data_source_first_row", "Data source (first row)") },
            { value: "parameter", label: dt("reports.designer.parameter", "Parameter") },
            { value: "fixed", label: dt("reports.designer.fixed_id", "Fixed id") },
          ]}
          onChange={(v) =>
            set(
              {
                dataSourceId: v === "data" ? (definition.dataSources[0]?.id ?? null) : null,
                field: null,
                parameter: v === "parameter" ? (definition.parameters[0]?.name ?? null) : null,
                id: null,
              },
              "from",
            )
          }
        />
      </Field>
      {from === "data" && (
        <div className="grid grid-cols-2 gap-2">
          <Field label={dt("reports.designer.data_source", "Data source")}>
            <Select
              value={media.dataSourceId ?? ""}
              placeholder={dt("common.choose", "Choose")}
              options={definition.dataSources.map((d) => ({ value: d.id, label: d.name }))}
              onChange={(v) => set({ dataSourceId: v || null, field: null }, "source")}
            />
          </Field>
          <Field label={dt("reports.designer.id_column", "Id column")}>
            <Select
              value={media.field ?? ""}
              placeholder={dt("common.choose", "Choose")}
              options={columns.map((c) => ({ value: c.name, label: c.label }))}
              onChange={(v) => set({ field: v || null }, "field")}
            />
          </Field>
        </div>
      )}
      {from === "parameter" && (
        <Field label={dt("reports.designer.parameter", "Parameter")}>
          <Select
            value={media.parameter ?? ""}
            placeholder={definition.parameters.length ? dt("common.choose", "Choose") : dt("reports.designer.add_one_in_the_data_tab", "Add one in the Data tab")}
            options={definition.parameters.map((p) => ({ value: p.name, label: `@${p.name}` }))}
            onChange={(v) => set({ parameter: v || null }, "parameter")}
          />
        </Field>
      )}
      {from === "fixed" && (
        <Field label={media.type === "user" ? dt("reports.designer.user_id", "User id") : dt("reports.designer.item_id", "Item id")}>
          <TextInput value={media.id ?? ""} onChange={(v) => set({ id: v.trim() || null }, "id")} />
        </Field>
      )}
    </>
  );
}

function ImageContent({ e }: { e: ReportElement }) {
  const { updateElements } = useDesigner();
  const fileRef = useRef<HTMLInputElement>(null);
  const setSrc = (src: string | null) =>
    updateElements(
      [e.id],
      (x) => {
        x.src = src;
      },
      `image-${e.id}`,
    );

  return (
    <Section title={dt("reports.designer.image", "Image")}>
      <Field label={dt("common.source", "Source")}>
        <Select
          value={e.media ? "media" : "file"}
          options={[
            { value: "file", label: dt("reports.designer.upload_or_url", "Upload or URL") },
            { value: "media", label: dt("reports.designer.media_server_image", "Media server image") },
          ]}
          onChange={(v) =>
            updateElements([e.id], (x) => {
              x.media = v === "media" ? { type: "item", imageType: "Primary", dataSourceId: null, field: null, parameter: null, id: null } : null;
            })
          }
        />
      </Field>
      {e.media ? (
        <MediaSettings e={e} />
      ) : (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(ev) => {
              const file = ev.target.files?.[0];
              ev.target.value = "";
              if (!file) {
                return;
              }
              if (file.size > MAX_IMAGE_BYTES) {
                toast.error(i18next.t("reports.designer_image_too_big", "Images must be 5 MB or smaller"));
                return;
              }
              const reader = new FileReader();
              reader.onload = () => setSrc(String(reader.result));
              reader.readAsDataURL(file);
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 px-2 py-2 rounded-md border border-dashed border-border text-xs text-gray-300 hover:text-white hover:border-primary cursor-pointer"
          >
            <Upload size={14} /> {dt("reports.designer.upload_image", "Upload image")}
          </button>
          <Field label={dt("reports.designer.or_url", "Or URL")}>
            <TextInput value={e.src?.startsWith("data:") ? "" : (e.src ?? "")} placeholder="https://..." onChange={(v) => setSrc(v || null)} />
          </Field>
          {e.src?.startsWith("data:") && <p className="text-xs text-gray-500">Embedded image ({Math.round((e.src.length * 0.75) / 1024)} KB)</p>}
          {e.src && !e.src.startsWith("data:") && (
            <p className="text-xs text-warning">
              {dt("reports.designer.server_exports_only_fetch_urls_from_your_jellyfi", "Server exports only fetch URLs from your Jellyfin/Emby server or Jellystat. For other sites, upload the image instead.")}
            </p>
          )}
        </>
      )}
      <Field label={dt("reports.designer.fit", "Fit")}>
        <Select
          value={e.fit ?? "contain"}
          options={[
            { value: "contain", label: dt("reports.designer.contain", "Contain") },
            { value: "cover", label: dt("reports.designer.cover", "Cover") },
            { value: "fill", label: dt("reports.designer.stretch", "Stretch") },
          ]}
          onChange={(v) =>
            updateElements([e.id], (x) => {
              x.fit = v;
            })
          }
        />
      </Field>
      <ElementLink e={e} />
    </Section>
  );
}

function StyleSection({ elements }: { elements: ReportElement[] }) {
  const { updateElements } = useDesigner();
  const first = elements[0];
  const s = first.style;
  const ids = elements.map((e) => e.id);
  const set = <K extends keyof ReportElementStyle>(key: K, value: ReportElementStyle[K]) =>
    updateElements(
      ids,
      (x) => {
        x.style[key] = value;
      },
      `style-${ids.join(",")}-${String(key)}`,
    );
  const hasText = elements.some((e) => ["text", "metric", "table", "chart"].includes(e.type));
  const isLine = elements.every((e) => e.type === "line");

  return (
    <Section title={elements.length > 1 ? dt("reports.designer.style_n_elements", "Style ({{count}} elements)", { defaultValue_one: "Style ({{count}} element)", count: elements.length }) : dt("reports.designer.style", "Style")}>
      {hasText && (
        <>
          <div className="grid grid-cols-[1fr_64px] gap-2">
            <Field label={dt("reports.designer.font", "Font")}>
              <FontPicker value={s.fontFamily} onChange={(v) => set("fontFamily", v)} />
            </Field>
            <Field label={dt("common.size", "Size")}>
              <NumberInput value={s.fontSize} min={4} max={400} onChange={(v) => set("fontSize", v ?? 14)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label={dt("reports.designer.weight", "Weight")}>
              <Select
                value={s.fontWeight}
                options={[
                  { value: "300", label: dt("reports.designer.light", "Light") },
                  { value: "normal", label: dt("reports.designer.regular", "Regular") },
                  { value: "600", label: dt("reports.designer.semibold", "Semibold") },
                  { value: "bold", label: dt("reports.designer.bold", "Bold") },
                  { value: "900", label: dt("reports.designer.black", "Black") },
                ]}
                onChange={(v) => set("fontWeight", v)}
              />
            </Field>
            <Field label={dt("reports.designer.text_colour", "Text colour")}>
              <ColorInput value={s.color} onChange={(v) => set("color", v ?? "#111827")} />
            </Field>
            <Field label={dt("reports.designer.align", "Align")}>
              <Select
                value={s.textAlign}
                options={[
                  { value: "left", label: dt("reports.designer.left", "Left") },
                  { value: "center", label: dt("reports.designer.center", "Center") },
                  { value: "right", label: dt("reports.designer.right", "Right") },
                ]}
                onChange={(v) => set("textAlign", v)}
              />
            </Field>
            <Field label={dt("reports.designer.vertical", "Vertical")}>
              <Select
                value={s.verticalAlign}
                options={[
                  { value: "top", label: dt("reports.designer.top", "Top") },
                  { value: "middle", label: dt("reports.designer.middle", "Middle") },
                  { value: "bottom", label: dt("reports.designer.bottom", "Bottom") },
                ]}
                onChange={(v) => set("verticalAlign", v)}
              />
            </Field>
          </div>
          <div className="flex items-center gap-4">
            <Toggle label={dt("reports.designer.italic", "Italic")} checked={s.italic} onChange={(v) => set("italic", v)} />
            <Toggle label={dt("reports.designer.underline", "Underline")} checked={s.underline} onChange={(v) => set("underline", v)} />
            <Field label={dt("reports.designer.line_height", "Line height")} className="w-20">
              <NumberInput value={s.lineHeight} min={0.5} max={4} step={0.1} onChange={(v) => set("lineHeight", v ?? 1.3)} />
            </Field>
          </div>
        </>
      )}
      <div className="grid grid-cols-2 gap-2">
        {!isLine && (
          <Field label={dt("reports.designer.fill", "Fill")}>
            <ColorInput allowNone value={s.background} onChange={(v) => set("background", v)} />
          </Field>
        )}
        <Field label={isLine ? dt("reports.designer.line_colour", "Line colour") : dt("reports.designer.border_colour", "Border colour")}>
          <ColorInput allowNone value={s.borderColor} onChange={(v) => set("borderColor", v)} />
        </Field>
        <Field label={isLine ? dt("reports.designer.thickness", "Thickness") : dt("reports.designer.border_width", "Border width")}>
          <NumberInput value={s.borderWidth} min={0} max={100} onChange={(v) => set("borderWidth", v ?? 0)} />
        </Field>
        <Field label={isLine ? dt("reports.designer.line_style", "Line style") : dt("reports.designer.border_style", "Border style")}>
          <Select
            value={s.borderStyle}
            options={[
              { value: "solid", label: dt("reports.designer.solid", "Solid") },
              { value: "dashed", label: dt("reports.designer.dashed", "Dashed") },
              { value: "dotted", label: dt("reports.designer.dotted", "Dotted") },
            ]}
            onChange={(v) => set("borderStyle", v)}
          />
        </Field>
        {!isLine && (
          <>
            <Field label={dt("reports.designer.corner_radius", "Corner radius")}>
              <NumberInput value={s.borderRadius} min={0} max={500} onChange={(v) => set("borderRadius", v ?? 0)} />
            </Field>
            <Field label={dt("reports.designer.padding", "Padding")}>
              <NumberInput value={s.padding} min={0} max={500} onChange={(v) => set("padding", v ?? 0)} />
            </Field>
          </>
        )}
      </div>
    </Section>
  );
}

export default function Inspector() {
  const { selected, updateElements } = useDesigner();

  if (selected.length === 0) {
    return <PageSetup />;
  }

  const e = selected[0];
  const single = selected.length === 1;
  return (
    <div>
      <Arrange />
      {single && <Layout e={e} />}
      {single && e.type === "text" && (
        <Section title={dt("reports.designer.text", "Text")}>
          <TextInput
            multiline
            rows={4}
            value={e.text ?? ""}
            onChange={(v) =>
              updateElements(
                [e.id],
                (x) => {
                  x.text = v;
                },
                `text-${e.id}`,
              )
            }
          />
          <TokenHelp />
          <ElementLink e={e} />
        </Section>
      )}
      {single && e.type === "metric" && <MetricContent e={e} />}
      {single && e.type === "table" && <TableContent e={e} />}
      {single && e.type === "chart" && <ChartContent e={e} />}
      {single && e.type === "image" && <ImageContent e={e} />}
      {single && e.type === "cards" && <CardsContent e={e} />}
      {single && (e.type === "table" || e.type === "metric" || e.type === "cards") && <ConditionsContent e={e} />}
      {single && <PagesSection e={e} />}
      {single && e.type === "shape" && (
        <Section title={dt("reports.designer.shape", "Shape")}>
          <Select
            value={e.shape ?? "rect"}
            options={[
              { value: "rect", label: dt("reports.designer.rectangle", "Rectangle") },
              { value: "ellipse", label: dt("reports.designer.ellipse", "Ellipse") },
            ]}
            onChange={(v) =>
              updateElements([e.id], (x) => {
                x.shape = v;
              })
            }
          />
        </Section>
      )}
      <StyleSection elements={selected} />
    </div>
  );
}
