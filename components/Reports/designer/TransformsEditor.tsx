import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { ReportColumn, ReportParameter, ReportSort, ReportTransform, ReportTransformType } from "@/lib/models/reports";
import { applyTransformColumns } from "@/lib/reports/columns";
import { CALCULATED_TYPES } from "./CalculatedFieldsEditor";
import { Field, inputClass, NumberInput, Select, TextInput, Toggle } from "./controls";

export const TRANSFORM_LABELS: Record<ReportTransformType, { label: string; help: string }> = {
  filter: { label: "Filter rows", help: "Keep rows matching a condition on the result, e.g. plays at least 10 (works on totals)." },
  calculate: {
    label: "Calculate column",
    help: 'Add a column computed from the row\'s other columns, e.g. watch / plays / 60, or iif(plays >= 10, "Regular", "Casual").',
  },
  topN: { label: "Top N", help: 'Keep the highest (or lowest) rows, optionally per group, folding the rest into an "Other" row.' },
  pivot: { label: "Pivot", help: "Turn the values of one column into columns, e.g. users down the side and months across." },
  runningTotal: { label: "Running total", help: "Add a column that accumulates a value down the rows." },
  percentOfTotal: { label: "Percent of total", help: "Add a column with each row's share of the total." },
  rank: { label: "Rank", help: "Add a column ranking rows by a value (ties share a rank)." },
  change: { label: "Change from previous", help: "Add a column with the difference (or % change) from the row above." },
  fillDates: { label: "Fill missing dates", help: "Add zero rows for days, months, hours or weekdays with no data, so charts don't skip them." },
  sort: { label: "Sort", help: "Sort the result, including columns added by earlier steps." },
  limit: { label: "Limit", help: "Keep only the first N rows." },
};

const FILTER_OPERATORS = [
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

const newStep = (type: ReportTransformType, columns: ReportColumn[]): ReportTransform => {
  const numeric = columns.find((c) => ["integer", "number", "duration", "bytes"].includes(c.type))?.name ?? columns[0]?.name ?? null;
  const text = columns.find((c) => c.type === "string")?.name ?? columns[0]?.name ?? null;
  switch (type) {
    case "filter":
      return { type, field: numeric, operator: "gte", value: 0 };
    case "topN":
      return { type, field: numeric, count: 5, desc: true, otherLabel: "Other" };
    case "pivot":
      return {
        type,
        rowField: text,
        columnField: columns.find((c) => c.name !== text)?.name ?? null,
        field: numeric,
        aggregate: "sum",
        fillZero: true,
        sortColumns: true,
      };
    case "fillDates":
      return { type, field: columns[0]?.name ?? null, count: null };
    case "sort":
      return { type, sort: numeric ? [{ field: numeric, desc: true }] : [] };
    case "limit":
      return { type, count: 10 };
    case "calculate":
      return { type, alias: "calculated", expression: numeric ?? "", mode: null };
    default:
      return { type, field: numeric, desc: true, mode: type === "change" ? "difference" : null };
  }
};

function ColumnSelect({
  value,
  columns,
  onChange,
  optional,
}: {
  value?: string | null;
  columns: ReportColumn[];
  onChange: (v: string | null) => void;
  optional?: string;
}) {
  const known = columns.some((c) => c.name === value);
  return (
    <Select
      value={value ?? ""}
      placeholder={optional}
      options={[
        ...columns.map((c) => ({ value: c.name, label: c.label === c.name ? c.name : `${c.label} (${c.name})` })),
        ...(value && !known ? [{ value, label: value }] : []),
      ]}
      onChange={(v) => onChange(v || null)}
    />
  );
}

function StepFields({
  step,
  columns,
  parameters,
  set,
}: {
  step: ReportTransform;
  columns: ReportColumn[];
  parameters: ReportParameter[];
  set: (patch: Partial<ReportTransform>) => void;
}) {
  switch (step.type) {
    case "filter":
      return (
        <div className="grid grid-cols-3 gap-1.5">
          <ColumnSelect value={step.field} columns={columns} onChange={(v) => set({ field: v })} />
          <Select value={step.operator ?? "eq"} options={FILTER_OPERATORS} onChange={(v) => set({ operator: v })} />
          {step.operator !== "isNull" && step.operator !== "isNotNull" && (
            <div className="flex gap-1 min-w-0">
              {parameters.length > 0 && (
                <select
                  className={`${inputClass} w-auto! shrink-0 cursor-pointer`}
                  value={step.parameter ?? ""}
                  onKeyDown={(ev) => ev.stopPropagation()}
                  onChange={(ev) => set({ parameter: ev.target.value || null })}
                >
                  <option value="">Value</option>
                  {parameters.map((p) => (
                    <option key={p.name} value={p.name}>
                      @{p.name}
                    </option>
                  ))}
                </select>
              )}
              {!step.parameter && (
                <TextInput
                  value={step.value === null || step.value === undefined ? "" : String(step.value)}
                  onChange={(v) => set({ value: v !== "" && Number.isFinite(Number(v)) ? Number(v) : v })}
                />
              )}
            </div>
          )}
        </div>
      );
    case "topN":
      return (
        <div className="grid grid-cols-2 gap-1.5">
          <Field label="By">
            <ColumnSelect value={step.field} columns={columns} onChange={(v) => set({ field: v })} />
          </Field>
          <div className="grid grid-cols-[70px_1fr] gap-1.5">
            <Field label="N">
              <NumberInput value={step.count ?? 5} min={1} onChange={(v) => set({ count: v ?? 5 })} />
            </Field>
            <Field label="Keep">
              <Select
                value={step.desc === false ? "lowest" : "highest"}
                options={[
                  { value: "highest", label: "Highest" },
                  { value: "lowest", label: "Lowest" },
                ]}
                onChange={(v) => set({ desc: v === "highest" })}
              />
            </Field>
          </div>
          <Field label="Per group (optional)">
            <ColumnSelect value={step.partitionBy} columns={columns} optional="Whole result" onChange={(v) => set({ partitionBy: v })} />
          </Field>
          <Field label="Rest as (blank = drop)">
            <TextInput value={step.otherLabel ?? ""} placeholder="Other" onChange={(v) => set({ otherLabel: v || null })} />
          </Field>
        </div>
      );
    case "pivot":
      return (
        <div className="grid grid-cols-2 gap-1.5">
          <Field label="Rows">
            <ColumnSelect value={step.rowField} columns={columns} onChange={(v) => set({ rowField: v })} />
          </Field>
          <Field label="Columns from">
            <ColumnSelect value={step.columnField} columns={columns} onChange={(v) => set({ columnField: v })} />
          </Field>
          <Field label="Values">
            <ColumnSelect value={step.field} columns={columns} onChange={(v) => set({ field: v })} />
          </Field>
          <Field label="Combine with">
            <Select
              value={step.aggregate ?? "sum"}
              options={["sum", "count", "avg", "min", "max", "first"].map((a) => ({ value: a, label: a }))}
              onChange={(v) => set({ aggregate: v })}
            />
          </Field>
          <Toggle label="Empty cells as 0" checked={step.fillZero !== false} onChange={(v) => set({ fillZero: v })} />
          <Toggle label="Sort columns" checked={step.sortColumns !== false} onChange={(v) => set({ sortColumns: v })} />
        </div>
      );
    case "fillDates":
      return (
        <div className="grid grid-cols-2 gap-1.5">
          <Field label="Date bucket column">
            <ColumnSelect value={step.field} columns={columns} onChange={(v) => set({ field: v })} />
          </Field>
          <Field label="Range" hint="Blank: from the first to the last date in the data">
            <div className="flex gap-1">
              {parameters.length > 0 && (
                <select
                  className={`${inputClass} w-auto! shrink-0 cursor-pointer`}
                  value={step.parameter ?? ""}
                  onKeyDown={(ev) => ev.stopPropagation()}
                  onChange={(ev) => set({ parameter: ev.target.value || null })}
                >
                  <option value="">Days</option>
                  {parameters.map((p) => (
                    <option key={p.name} value={p.name}>
                      @{p.name}
                    </option>
                  ))}
                </select>
              )}
              {!step.parameter && <NumberInput value={step.count ?? null} min={1} placeholder="last N days" onChange={(v) => set({ count: v })} />}
            </div>
          </Field>
        </div>
      );
    case "sort":
      return (
        <div className="space-y-1">
          {(step.sort ?? []).map((s, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-1">
              <ColumnSelect
                value={s.field}
                columns={columns}
                onChange={(v) => set({ sort: (step.sort ?? []).map((x, j) => (j === i ? { ...x, field: v ?? "" } : x)) })}
              />
              <Select
                value={s.desc ? "desc" : "asc"}
                options={[
                  { value: "asc", label: "Ascending" },
                  { value: "desc", label: "Descending" },
                ]}
                onChange={(v) => set({ sort: (step.sort ?? []).map((x, j) => (j === i ? { ...x, desc: v === "desc" } : x)) })}
              />
              <button
                type="button"
                className="p-1 text-gray-500 hover:text-brand-rose cursor-pointer"
                onClick={() => set({ sort: (step.sort ?? []).filter((_, j) => j !== i) })}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white cursor-pointer"
            onClick={() => set({ sort: [...(step.sort ?? []), { field: columns[0]?.name ?? "", desc: true } as ReportSort] })}
          >
            <Plus size={12} /> Sort column
          </button>
        </div>
      );
    case "calculate":
      return (
        <div className="space-y-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            <Field label="New column name">
              <TextInput value={step.alias ?? ""} onChange={(v) => set({ alias: v.replace(/[^A-Za-z0-9_]/g, "") || null })} />
            </Field>
            <Field label="Type">
              <Select value={step.mode ?? "auto"} options={CALCULATED_TYPES} onChange={(v) => set({ mode: v === "auto" ? null : v })} />
            </Field>
          </div>
          <Field label="Expression">
            <TextInput multiline rows={2} value={step.expression ?? ""} placeholder="watch / plays / 60" onChange={(v) => set({ expression: v })} />
          </Field>
          <p className="text-[11px] text-gray-500">
            Columns:{" "}
            {columns
              .filter((c) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(c.name))
              .map((c) => c.name)
              .join(", ")}
          </p>
        </div>
      );
    case "limit":
      return (
        <Field label="Rows" className="w-28">
          <NumberInput value={step.count ?? 10} min={0} onChange={(v) => set({ count: v ?? 10 })} />
        </Field>
      );
    default:
      // runningTotal, percentOfTotal, rank, change
      return (
        <div className="grid grid-cols-2 gap-1.5">
          <Field label="Of">
            <ColumnSelect value={step.field} columns={columns} onChange={(v) => set({ field: v })} />
          </Field>
          <Field label="New column name">
            <TextInput
              value={step.alias ?? ""}
              placeholder={`${step.field ?? "value"}_${step.type === "runningTotal" ? "running" : step.type === "percentOfTotal" ? "pct" : step.type}`}
              onChange={(v) => set({ alias: v || null })}
            />
          </Field>
          <Field label="Restart for each (optional)">
            <ColumnSelect value={step.partitionBy} columns={columns} optional="Whole result" onChange={(v) => set({ partitionBy: v })} />
          </Field>
          {step.type === "rank" && (
            <Field label="Rank 1 is">
              <Select
                value={step.desc === false ? "lowest" : "highest"}
                options={[
                  { value: "highest", label: "Highest" },
                  { value: "lowest", label: "Lowest" },
                ]}
                onChange={(v) => set({ desc: v === "highest" })}
              />
            </Field>
          )}
          {step.type === "change" && (
            <Field label="As">
              <Select
                value={step.mode ?? "difference"}
                options={[
                  { value: "difference", label: "Difference" },
                  { value: "percent", label: "% change" },
                ]}
                onChange={(v) => set({ mode: v })}
              />
            </Field>
          )}
        </div>
      );
  }
}

/**
 * Post-query steps for a data source. Each step sees the columns produced by the steps before it; after a pivot the
 * columns depend on the data, so the last preview's columns are used when there are any.
 */
export default function TransformsEditor({
  transforms,
  columns,
  resultColumns,
  parameters,
  onChange,
}: {
  transforms: ReportTransform[];
  columns: ReportColumn[];
  resultColumns?: ReportColumn[] | null;
  parameters: ReportParameter[];
  onChange: (transforms: ReportTransform[]) => void;
}) {
  const columnsAt = (i: number) => {
    const { columns: cols, unknown } = applyTransformColumns(columns, transforms.slice(0, i));
    return unknown && resultColumns?.length ? resultColumns : cols;
  };
  const set = (i: number, patch: Partial<ReportTransform>) => onChange(transforms.map((t, j) => (j === i ? { ...t, ...patch } : t)));
  const move = (i: number, dir: -1 | 1) => {
    const next = [...transforms];
    const j = i + dir;
    if (j >= 0 && j < next.length) {
      [next[i], next[j]] = [next[j], next[i]];
      onChange(next);
    }
  };

  return (
    <div className="space-y-2">
      {transforms.map((step, i) => (
        <div key={i} className="rounded-lg border border-border bg-background/40 p-2 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-gray-600">{i + 1}</span>
            <span className="text-xs font-bold text-gray-200 flex-1" title={TRANSFORM_LABELS[step.type]?.help}>
              {TRANSFORM_LABELS[step.type]?.label ?? step.type}
            </span>
            <button type="button" title="Move up" className="p-0.5 text-gray-500 hover:text-white cursor-pointer" onClick={() => move(i, -1)}>
              <ArrowUp size={12} />
            </button>
            <button type="button" title="Move down" className="p-0.5 text-gray-500 hover:text-white cursor-pointer" onClick={() => move(i, 1)}>
              <ArrowDown size={12} />
            </button>
            <button
              type="button"
              title="Remove step"
              className="p-0.5 text-gray-500 hover:text-brand-rose cursor-pointer"
              onClick={() => onChange(transforms.filter((_, j) => j !== i))}
            >
              <Trash2 size={12} />
            </button>
          </div>
          <StepFields step={step} columns={columnsAt(i)} parameters={parameters} set={(patch) => set(i, patch)} />
        </div>
      ))}
      <select
        className={`${inputClass} w-auto! cursor-pointer`}
        value=""
        onKeyDown={(ev) => ev.stopPropagation()}
        onChange={(ev) => {
          const type = ev.target.value as ReportTransformType;
          if (type) {
            onChange([...transforms, newStep(type, columnsAt(transforms.length))]);
          }
        }}
      >
        <option value="">+ Add step...</option>
        {(Object.keys(TRANSFORM_LABELS) as ReportTransformType[]).map((t) => (
          <option key={t} value={t}>
            {TRANSFORM_LABELS[t].label}
          </option>
        ))}
      </select>
    </div>
  );
}
