import { Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import type { ReportCardOptions, ReportColumn, ReportCondition, ReportElement } from "@/lib/models/reports";
import { CONDITION_OPERATORS } from "@/lib/reports/conditions";
import { defaultCardOptions } from "@/lib/reports/defaults";
import { ColorInput, Field, NumberInput, Section, Select, TextInput, Toggle } from "./controls";
import { useDesigner } from "./designerStore";

/** Page flow: growing tables and card grids add pages for rows that don't fit; other elements can repeat on them. */
export function PagesSection({ e }: { e: ReportElement }) {
  const { updateElements } = useDesigner();
  const set = (patch: Partial<ReportElement>, key: string) =>
    updateElements(
      [e.id],
      (x) => {
        Object.assign(x, patch);
      },
      `pages-${e.id}-${key}`,
    );
  const grows = e.type === "table" || e.type === "cards";
  return (
    <Section title="Pages" defaultOpen={grows}>
      {grows && (
        <>
          <Toggle label="Continue on new pages when rows don't fit" checked={!!e.grow} onChange={(v) => set({ grow: v }, "grow")} />
          {e.grow && (
            <Field label="Top on the extra pages (px)" hint="It keeps its bottom edge, so it gets taller there">
              <div className="w-28">
                <NumberInput value={e.continueTop ?? 40} min={0} onChange={(v) => set({ continueTop: v ?? 40 }, "continueTop")} />
              </div>
            </Field>
          )}
        </>
      )}
      {!e.grow && (
        <Toggle
          label="Show on the extra pages too (headers, footers, page numbers)"
          checked={!!e.repeat}
          onChange={(v) => set({ repeat: v }, "repeat")}
        />
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
    <Section title="Conditional formatting" defaultOpen={conditions.length > 0}>
      <p className="text-[11px] text-gray-500">
        {e.type === "metric"
          ? "Checked against the first row; styles the value."
          : e.type === "cards"
            ? "Checked for each card's row; styles the card."
            : "Checked for each row; styles the row or one column. Later rules win."}
      </p>
      {conditions.map((c, i) => {
        const numeric = ["gt", "gte", "lt", "lte"].includes(c.operator);
        const noValue = c.operator === "isNull" || c.operator === "isNotNull";
        return (
          <div key={i} className="rounded-lg border border-border bg-background/40 p-2 space-y-1.5">
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-1">
              <Select value={c.field} placeholder="Column" options={columnOptions} onChange={(v) => set(i, { field: v }, "field")} />
              <Select value={c.operator} options={CONDITION_OPERATORS} onChange={(v) => set(i, { operator: v }, "op")} />
              <button
                type="button"
                title="Remove"
                className="p-1 text-gray-500 hover:text-brand-rose cursor-pointer"
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
                placeholder="Value"
                onChange={(v) => set(i, { value: numeric && v.trim() !== "" && !Number.isNaN(Number(v)) ? Number(v) : v }, "value")}
              />
            )}
            {isTable && (
              <Select
                value={c.target ?? ""}
                options={[{ value: "", label: "Style the whole row" }, ...columns.map((x) => ({ value: x.name, label: `Style ${x.label}` }))]}
                onChange={(v) => set(i, { target: v || null }, "target")}
              />
            )}
            <div className="grid grid-cols-2 gap-1.5">
              <Field label="Text">
                <ColorInput value={c.color} allowNone onChange={(v) => set(i, { color: v }, "color")} />
              </Field>
              <Field label="Fill">
                <ColorInput value={c.background} allowNone onChange={(v) => set(i, { background: v }, "background")} />
              </Field>
            </div>
            <div>
              <Select
                value={c.bold === true ? "bold" : c.bold === false ? "normal" : ""}
                options={[
                  { value: "", label: "Weight as is" },
                  { value: "bold", label: "Bold" },
                  { value: "normal", label: "Not bold" },
                ]}
                onChange={(v) => set(i, { bold: v === "bold" ? true : v === "normal" ? false : null }, "bold")}
              />
            </div>
          </div>
        );
      })}
      <button
        type="button"
        className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white cursor-pointer"
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
        <Plus size={12} /> Rule
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
    <Section title="Cards">
      {picker}
      <div className="grid grid-cols-3 gap-1.5">
        <Field label="Columns">
          <NumberInput value={o.columns} min={1} max={24} onChange={(v) => set({ columns: v ?? 4 }, "columns")} />
        </Field>
        <Field label="Card height">
          <NumberInput value={o.cardHeight} min={20} onChange={(v) => set({ cardHeight: v ?? 240 }, "cardHeight")} />
        </Field>
        <Field label="Gap">
          <NumberInput value={o.gap} min={0} onChange={(v) => set({ gap: v ?? 12 }, "gap")} />
        </Field>
      </div>

      <Field label="Picture">
        <Select
          value={o.imagePosition}
          options={[
            { value: "top", label: "On top" },
            { value: "left", label: "On the left" },
            { value: "none", label: "No picture" },
          ]}
          onChange={(v) => set({ imagePosition: v as ReportCardOptions["imagePosition"] }, "imagePosition")}
        />
      </Field>
      {o.imagePosition !== "none" && (
        <>
          <div className="grid grid-cols-2 gap-1.5">
            <Field label="Media id column">
              <Select
                value={o.imageField ?? ""}
                placeholder="Choose..."
                options={columnOptions}
                onChange={(v) => set({ imageField: v || null }, "imageField")}
              />
            </Field>
            <Field label="Picture of">
              <Select
                value={o.imageKind === "user" ? "user" : o.imageType === "Backdrop" ? "backdrop" : "poster"}
                options={[
                  { value: "poster", label: "Item poster" },
                  { value: "backdrop", label: "Item backdrop" },
                  { value: "user", label: "User avatar" },
                ]}
                onChange={(v) =>
                  set({ imageKind: v === "user" ? "user" : "item", imageType: v === "backdrop" ? "Backdrop" : "Primary" }, "imageKind")
                }
              />
            </Field>
          </div>
          <Field label={`Picture size (${Math.round(o.imageSize * 100)}% of the card)`}>
            <input
              type="range"
              min={10}
              max={95}
              value={Math.round(o.imageSize * 100)}
              onChange={(ev) => set({ imageSize: Number(ev.target.value) / 100 }, "imageSize")}
              className="w-full accent-brand-purple"
            />
          </Field>
        </>
      )}

      {(["title", "subtitle", "value"] as const).map((key) => (
        <Field key={key} label={key === "title" ? "Title (bold)" : key === "subtitle" ? "Subtitle (small)" : "Value"}>
          <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-1">
            <TextInput value={o[key] ?? ""} placeholder="{{row.Name}}" onChange={(v) => set({ [key]: v || null }, key)} />
            <Select value="" placeholder="+ column" options={columnOptions} onChange={(v) => v && insert(key, v)} />
          </div>
        </Field>
      ))}
      <p className="text-[11px] text-gray-500">{ROW_TOKEN_HELP}</p>

      <Field label="Card fill">
        <ColorInput value={o.cardBackground} allowNone onChange={(v) => set({ cardBackground: v }, "cardBackground")} />
      </Field>
      <div className="grid grid-cols-2 gap-1.5">
        <Field label="Corner radius">
          <NumberInput value={o.cardRadius} min={0} onChange={(v) => set({ cardRadius: v ?? 0 }, "cardRadius")} />
        </Field>
        <Field label="Max cards">
          <NumberInput value={o.maxItems ?? null} min={1} onChange={(v) => set({ maxItems: v }, "maxItems")} />
        </Field>
      </div>
      <Field label="Link for each card (optional)" hint="e.g. https://jellyfin.example/web/#/details?id={{row.Id}}">
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
