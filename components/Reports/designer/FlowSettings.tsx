import { Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import type { ReportCardOptions, ReportColumn, ReportCondition, ReportElement } from "@/lib/models/reports";
import { CONDITION_OPERATORS } from "@/lib/reports/conditions";
import { defaultCardOptions } from "@/lib/reports/defaults";
import { isGrowing, pageZones } from "@/lib/reports/layout";
import { ColorInput, Field, NumberInput, Section, Select, TextInput, Toggle } from "./controls";
import { useDesigner } from "./designerStore";
import { dt } from "./i18n";

/**
 * Page flow: growing tables and card grids add pages for rows that don't fit. What else appears on those pages
 * follows from position: the header zone (above the dashed header line) and footer zone (below the growing element).
 */
export function PagesSection({ e }: { e: ReportElement }) {
  const { updateElements, page } = useDesigner();
  const set = (patch: Partial<ReportElement>, key: string) =>
    updateElements(
      [e.id],
      (x) => {
        Object.assign(x, patch);
      },
      `pages-${e.id}-${key}`,
    );
  const grows = e.type === "table" || e.type === "cards";
  const zones = pageZones(page);
  // Other elements only need this section when something on the page grows
  if (!grows && !zones) {
    return null;
  }
  const inZone = !!zones && !isGrowing(e) && (e.y + e.height <= zones.header + 0.5 || e.y >= zones.footer - 0.5);
  return (
    <Section title={dt("reports.designer.pages", "Pages")} defaultOpen={grows}>
      {grows && (
        <>
          <Toggle label={dt("reports.designer.continue_on_new_pages_when_rows_don_t_fit", "Continue on new pages when rows don't fit")} checked={!!e.grow} onChange={(v) => set({ grow: v }, "grow")} />
          {e.grow && (
            <>
              <Field label={dt("reports.designer.header_height_px", "Header height (px)")} hint={dt("reports.designer.drag_the_dashed_header_line_on_the_page_or_type", "Drag the dashed header line on the page, or type it here")}>
                <div className="w-28">
                  <NumberInput value={e.continueTop ?? 40} min={0} max={e.y} onChange={(v) => set({ continueTop: v ?? 40 }, "continueTop")} />
                </div>
              </Field>
              <p className="text-xs text-gray-500">
                {dt("reports.designer.the_extra_pages_repeat_everything_above_the_head", "The extra pages repeat everything above the header line and everything below this element, like page headers and footers. Elements in between only appear on the first page. This element starts at the header line there.")}
              </p>
            </>
          )}
        </>
      )}
      {!isGrowing(e) && zones && (
        <>
          <p className="text-xs text-gray-500">
            {!inZone
              ? dt("reports.designer.between_the_header_line_and_the_growing_element", "Between the header line and the growing element: first page only.")
              : e.firstPageOnly
                ? dt("reports.designer.in_the_header_or_footer_zone_but_kept_to_the_fir", "In the header or footer zone, but kept to the first page.")
                : dt("reports.designer.in_the_header_or_footer_zone_repeats_on_every_ex", "In the header or footer zone: repeats on every extra page.")}
          </p>
          {inZone && <Toggle label={dt("reports.designer.first_page_only", "First page only")} checked={!!e.firstPageOnly} onChange={(v) => set({ firstPageOnly: v }, "firstPageOnly")} />}
        </>
      )}
    </Section>
  );
}

/** Styles for rows (or table cells) that match a condition. */
export function ConditionsSection({ e, columns }: { e: ReportElement; columns: ReportColumn[] }) {
  const { updateElements } = useDesigner();
  const conditions = e.conditions ?? [];
  const setAll = (next: ReportCondition[], key: string) =>
    updateElements(
      [e.id],
      (x) => {
        x.conditions = next;
      },
      `conditions-${e.id}-${key}`,
    );
  const set = (i: number, patch: Partial<ReportCondition>, key: string) =>
    setAll(
      conditions.map((c, j) => (j === i ? { ...c, ...patch } : c)),
      `${i}-${key}`,
    );
  const columnOptions = columns.map((c) => ({ value: c.name, label: c.label === c.name ? c.name : `${c.label} (${c.name})` }));
  const isTable = e.type === "table";

  return (
    <Section title={dt("reports.designer.conditional_formatting", "Conditional formatting")} defaultOpen={conditions.length > 0}>
      <p className="text-xs text-gray-500">
        {e.type === "metric"
          ? dt("reports.designer.checked_against_the_first_row_styles_the_value", "Checked against the first row; styles the value.")
          : e.type === "cards"
            ? dt("reports.designer.checked_for_each_card_s_row_styles_the_card", "Checked for each card's row; styles the card.")
            : dt("reports.designer.checked_for_each_row_styles_the_row_or_one_colum", "Checked for each row; styles the row or one column. Later rules win.")}
      </p>
      {conditions.map((c, i) => {
        const numeric = ["gt", "gte", "lt", "lte"].includes(c.operator);
        const noValue = c.operator === "isNull" || c.operator === "isNotNull";
        return (
          <div key={i} className="rounded-lg border border-border bg-background/40 p-2 space-y-1.5">
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-1">
              <Select value={c.field} placeholder={dt("reports.designer.column", "Column")} options={columnOptions} onChange={(v) => set(i, { field: v }, "field")} />
              <Select value={c.operator} options={CONDITION_OPERATORS} onChange={(v) => set(i, { operator: v }, "op")} />
              <button
                type="button"
                title={dt("reports.designer.remove", "Remove")}
                className="p-1 text-gray-500 hover:text-danger cursor-pointer"
                onClick={() =>
                  setAll(
                    conditions.filter((_, j) => j !== i),
                    "del",
                  )
                }
              >
                <Trash2 size={12} />
              </button>
            </div>
            {!noValue && (
              <TextInput
                value={c.value === null || c.value === undefined ? "" : String(c.value)}
                placeholder={dt("reports.designer.value", "Value")}
                onChange={(v) => set(i, { value: numeric && v.trim() !== "" && !Number.isNaN(Number(v)) ? Number(v) : v }, "value")}
              />
            )}
            {isTable && (
              <Select
                value={c.target ?? ""}
                options={[{ value: "", label: dt("reports.designer.style_the_whole_row", "Style the whole row") }, ...columns.map((x) => ({ value: x.name, label: dt("reports.designer.style_column", "Style {{column}}", { column: x.label }) }))]}
                onChange={(v) => set(i, { target: v || null }, "target")}
              />
            )}
            <div className="grid grid-cols-2 gap-1.5">
              <Field label={dt("reports.designer.text", "Text")}>
                <ColorInput value={c.color} allowNone onChange={(v) => set(i, { color: v }, "color")} />
              </Field>
              <Field label={dt("reports.designer.fill", "Fill")}>
                <ColorInput value={c.background} allowNone onChange={(v) => set(i, { background: v }, "background")} />
              </Field>
            </div>
            <div>
              <Select
                value={c.bold === true ? "bold" : c.bold === false ? "normal" : ""}
                options={[
                  { value: "", label: dt("reports.designer.weight_as_is", "Weight as is") },
                  { value: "bold", label: dt("reports.designer.bold", "Bold") },
                  { value: "normal", label: dt("reports.designer.not_bold", "Not bold") },
                ]}
                onChange={(v) => set(i, { bold: v === "bold" ? true : v === "normal" ? false : null }, "bold")}
              />
            </div>
          </div>
        );
      })}
      <button
        type="button"
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-white cursor-pointer"
        onClick={() =>
          setAll(
            [
              ...conditions,
              { field: columns[0]?.name ?? "", operator: "gte", value: null, target: null, color: null, background: "#fef3c7", bold: null },
            ],
            "add",
          )
        }
      >
        <Plus size={12} /> {dt("reports.designer.rule", "Rule")}
      </button>
    </Section>
  );
}

const ROW_TOKEN_HELP = "Use {{row.FIELD}} for the card's row, with an optional |format, e.g. {{row.Plays|integer}} plays.";

/** Card grid: one card per row with an optional picture and three text lines. */
export function CardsSection({ e, columns, picker }: { e: ReportElement; columns: ReportColumn[]; picker: ReactNode }) {
  const { updateElements } = useDesigner();
  const o: ReportCardOptions = { ...defaultCardOptions(), ...(e.cards ?? {}) };
  const set = (patch: Partial<ReportCardOptions>, key: string) =>
    updateElements(
      [e.id],
      (x) => {
        x.cards = { ...defaultCardOptions(), ...(x.cards ?? {}), ...patch };
      },
      `cards-${e.id}-${key}`,
    );
  const columnOptions = columns.map((c) => ({ value: c.name, label: c.label === c.name ? c.name : `${c.label} (${c.name})` }));
  const insert = (key: "title" | "subtitle" | "value", field: string) => set({ [key]: `${o[key] ?? ""}{{row.${field}}}` }, key);

  return (
    <Section title={dt("reports.designer.cards", "Cards")}>
      {picker}
      <div className="grid grid-cols-3 gap-1.5">
        <Field label={dt("reports.designer.columns_2", "Columns")}>
          <NumberInput value={o.columns} min={1} max={24} onChange={(v) => set({ columns: v ?? 4 }, "columns")} />
        </Field>
        <Field label={dt("reports.designer.card_height", "Card height")}>
          <NumberInput value={o.cardHeight} min={20} onChange={(v) => set({ cardHeight: v ?? 240 }, "cardHeight")} />
        </Field>
        <Field label={dt("reports.designer.gap", "Gap")}>
          <NumberInput value={o.gap} min={0} onChange={(v) => set({ gap: v ?? 12 }, "gap")} />
        </Field>
      </div>

      <Field label={dt("reports.designer.picture", "Picture")}>
        <Select
          value={o.imagePosition}
          options={[
            { value: "top", label: dt("reports.designer.on_top", "On top") },
            { value: "left", label: dt("reports.designer.on_the_left", "On the left") },
            { value: "none", label: dt("reports.designer.no_picture", "No picture") },
          ]}
          onChange={(v) => set({ imagePosition: v as ReportCardOptions["imagePosition"] }, "imagePosition")}
        />
      </Field>
      {o.imagePosition !== "none" && (
        <>
          <div className="grid grid-cols-2 gap-1.5">
            <Field label={dt("reports.designer.media_id_column", "Media id column")}>
              <Select
                value={o.imageField ?? ""}
                placeholder={dt("reports.designer.choose", "Choose...")}
                options={columnOptions}
                onChange={(v) => set({ imageField: v || null }, "imageField")}
              />
            </Field>
            <Field label={dt("reports.designer.picture_of", "Picture of")}>
              <Select
                value={o.imageKind === "user" ? "user" : o.imageType === "Backdrop" ? "backdrop" : "poster"}
                options={[
                  { value: "poster", label: dt("reports.designer.item_poster", "Item poster") },
                  { value: "backdrop", label: dt("reports.designer.item_backdrop", "Item backdrop") },
                  { value: "user", label: dt("reports.designer.user_avatar", "User avatar") },
                ]}
                onChange={(v) =>
                  set({ imageKind: v === "user" ? "user" : "item", imageType: v === "backdrop" ? "Backdrop" : "Primary" }, "imageKind")
                }
              />
            </Field>
          </div>
          <Field label={dt("reports.designer.picture_size", "Picture size ({{percent}}% of the card)", { percent: Math.round(o.imageSize * 100) })}>
            <input
              type="range"
              min={10}
              max={95}
              value={Math.round(o.imageSize * 100)}
              onChange={(ev) => set({ imageSize: Number(ev.target.value) / 100 }, "imageSize")}
              className="w-full accent-primary"
            />
          </Field>
        </>
      )}

      {(["title", "subtitle", "value"] as const).map((key) => (
        <Field key={key} label={key === "title" ? dt("reports.designer.title_bold", "Title (bold)") : key === "subtitle" ? dt("reports.designer.subtitle_small", "Subtitle (small)") : dt("reports.designer.value", "Value")}>
          <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-1">
            <TextInput value={o[key] ?? ""} placeholder="{{row.Name}}" onChange={(v) => set({ [key]: v || null }, key)} />
            <Select value="" placeholder={dt("reports.designer.column_2", "+ column")} options={columnOptions} onChange={(v) => v && insert(key, v)} />
          </div>
        </Field>
      ))}
      <p className="text-xs text-gray-500">{ROW_TOKEN_HELP}</p>

      <Field label={dt("reports.designer.card_fill", "Card fill")}>
        <ColorInput value={o.cardBackground} allowNone onChange={(v) => set({ cardBackground: v }, "cardBackground")} />
      </Field>
      <div className="grid grid-cols-2 gap-1.5">
        <Field label={dt("reports.designer.corner_radius", "Corner radius")}>
          <NumberInput value={o.cardRadius} min={0} onChange={(v) => set({ cardRadius: v ?? 0 }, "cardRadius")} />
        </Field>
        <Field label={dt("reports.designer.max_cards", "Max cards")}>
          <NumberInput value={o.maxItems ?? null} min={1} onChange={(v) => set({ maxItems: v }, "maxItems")} />
        </Field>
      </div>
      <Field label={dt("reports.designer.link_for_each_card_optional", "Link for each card (optional)")} hint={dt("reports.designer.e_g_https_jellyfin_example_web_details_id_row_id", "e.g. https://jellyfin.example/web/#/details?id={{row.Id}}")}>
        <TextInput
          value={e.link ?? ""}
          placeholder="https://..."
          onChange={(v) =>
            updateElements(
              [e.id],
              (x) => {
                x.link = v || null;
              },
              `cards-${e.id}-link`,
            )
          }
        />
      </Field>
    </Section>
  );
}
