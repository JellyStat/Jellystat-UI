import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { ReportColumn, ReportParameter, ReportSort, ReportTransform, ReportTransformType } from "@/lib/models/reports";
import { applyTransformColumns } from "@/lib/reports/columns";
import { CALCULATED_TYPES } from "./CalculatedFieldsEditor";
import { Field, inputClass, NumberInput, Select, TextInput, Toggle } from "./controls";
import { dt } from "./i18n";

export const TRANSFORM_LABELS: Record<ReportTransformType, { label: string; help: string }> = {
  filter: { get label() { return dt("reports.designer.filter_rows", "Filter rows"); }, get help() { return dt("reports.designer.keep_rows_matching_a_condition_on_the_result_e_g", "Keep rows matching a condition on the result, e.g. plays at least 10 (works on totals)."); } },
  calculate: {
    get label() { return dt("reports.designer.calculate_column", "Calculate column"); },
    get help() {
      return dt(
        "reports.designer.calculate_column_help",
        'Add a column computed from the row\'s other columns, e.g. watch / plays / 60, or iif(plays >= 10, "Regular", "Casual").',
      );
    },
  },
  topN: { get label() { return dt("reports.designer.top_n", "Top N"); }, get help() { return dt("reports.designer.top_n_help", 'Keep the highest (or lowest) rows, optionally per group, folding the rest into an "Other" row.'); } },
  pivot: { get label() { return dt("reports.designer.pivot", "Pivot"); }, get help() { return dt("reports.designer.turn_the_values_of_one_column_into_columns_e_g_u", "Turn the values of one column into columns, e.g. users down the side and months across."); } },
  runningTotal: { get label() { return dt("reports.designer.running_total", "Running total"); }, get help() { return dt("reports.designer.add_a_column_that_accumulates_a_value_down_the_r", "Add a column that accumulates a value down the rows."); } },
  percentOfTotal: { get label() { return dt("reports.designer.percent_of_total", "Percent of total"); }, get help() { return dt("reports.designer.add_a_column_with_each_row_s_share_of_the_total", "Add a column with each row's share of the total."); } },
  rank: { get label() { return dt("reports.designer.rank", "Rank"); }, get help() { return dt("reports.designer.add_a_column_ranking_rows_by_a_value_ties_share", "Add a column ranking rows by a value (ties share a rank)."); } },
  change: { get label() { return dt("reports.designer.change_from_previous", "Change from previous"); }, get help() { return dt("reports.designer.add_a_column_with_the_difference_or_percent_chan", "Add a column with the difference (or % change) from the row above."); } },
  fillDates: { get label() { return dt("reports.designer.fill_missing_dates", "Fill missing dates"); }, get help() { return dt("reports.designer.add_zero_rows_for_days_months_hours_or_weekdays", "Add zero rows for days, months, hours or weekdays with no data, so charts don't skip them."); } },
  sort: { get label() { return dt("reports.designer.sort", "Sort"); }, get help() { return dt("reports.designer.sort_the_result_including_columns_added_by_earli", "Sort the result, including columns added by earlier steps."); } },
  limit: { get label() { return dt("reports.designer.limit", "Limit"); }, get help() { return dt("reports.designer.keep_only_the_first_n_rows", "Keep only the first N rows."); } },
};

const FILTER_OPERATORS = [
  { value: "eq", get label() { return dt("reports.designer.equals", "equals"); } },
  { value: "neq", get label() { return dt("reports.designer.does_not_equal", "does not equal"); } },
  { value: "gt", get label() { return dt("reports.designer.greater_than", "greater than"); } },
  { value: "gte", get label() { return dt("reports.designer.at_least", "at least"); } },
  { value: "lt", get label() { return dt("reports.designer.less_than", "less than"); } },
  { value: "lte", get label() { return dt("reports.designer.at_most", "at most"); } },
  { value: "contains", get label() { return dt("reports.designer.contains", "contains"); } },
  { value: "notContains", get label() { return dt("reports.designer.does_not_contain", "does not contain"); } },
  { value: "isNull", get label() { return dt("reports.designer.is_empty", "is empty"); } },
  { value: "isNotNull", get label() { return dt("reports.designer.is_not_empty", "is not empty"); } },
];

const newStep = (type: ReportTransformType, columns: ReportColumn[]): ReportTransform => {
  const numeric = columns.find((c) => ["integer", "number", "duration", "bytes"].includes(c.type))?.name ?? columns[0]?.name ?? null;
  const text = columns.find((c) => c.type === "string")?.name ?? columns[0]?.name ?? null;
  switch (type) {
    case "filter":
      return { type, field: numeric, operator: "gte", value: 0 };
    case "topN":
      return { type, field: numeric, count: 5, desc: true, otherLabel: dt("reports.designer.other", "Other") };
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
                  <option value="">{dt("common.value", "Value")}</option>
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
          <Field label={dt("reports.designer.by", "By")}>
            <ColumnSelect value={step.field} columns={columns} onChange={(v) => set({ field: v })} />
          </Field>
          <div className="grid grid-cols-[70px_1fr] gap-1.5">
            <Field label="N">
              <NumberInput value={step.count ?? 5} min={1} onChange={(v) => set({ count: v ?? 5 })} />
            </Field>
            <Field label={dt("reports.designer.keep", "Keep")}>
              <Select
                value={step.desc === false ? "lowest" : "highest"}
                options={[
                  { value: "highest", label: dt("reports.designer.highest", "Highest") },
                  { value: "lowest", label: dt("reports.designer.lowest", "Lowest") },
                ]}
                onChange={(v) => set({ desc: v === "highest" })}
              />
            </Field>
          </div>
          <Field label={dt("reports.designer.per_group_optional", "Per group (optional)")}>
            <ColumnSelect value={step.partitionBy} columns={columns} optional={dt("reports.designer.whole_result", "Whole result")} onChange={(v) => set({ partitionBy: v })} />
          </Field>
          <Field label={dt("reports.designer.rest_as_blank_drop", "Rest as (blank = drop)")}>
            <TextInput value={step.otherLabel ?? ""} placeholder={dt("reports.designer.other", "Other")} onChange={(v) => set({ otherLabel: v || null })} />
          </Field>
        </div>
      );
    case "pivot":
      return (
        <div className="grid grid-cols-2 gap-1.5">
          <Field label={dt("reports.designer.rows", "Rows")}>
            <ColumnSelect value={step.rowField} columns={columns} onChange={(v) => set({ rowField: v })} />
          </Field>
          <Field label={dt("reports.designer.columns_from", "Columns from")}>
            <ColumnSelect value={step.columnField} columns={columns} onChange={(v) => set({ columnField: v })} />
          </Field>
          <Field label={dt("reports.designer.values", "Values")}>
            <ColumnSelect value={step.field} columns={columns} onChange={(v) => set({ field: v })} />
          </Field>
          <Field label={dt("reports.designer.combine_with", "Combine with")}>
            <Select
              value={step.aggregate ?? "sum"}
              options={["sum", "count", "avg", "min", "max", "first"].map((a) => ({ value: a, label: a }))}
              onChange={(v) => set({ aggregate: v })}
            />
          </Field>
          <Toggle label={dt("reports.designer.empty_cells_as_0", "Empty cells as 0")} checked={step.fillZero !== false} onChange={(v) => set({ fillZero: v })} />
          <Toggle label={dt("reports.designer.sort_columns", "Sort columns")} checked={step.sortColumns !== false} onChange={(v) => set({ sortColumns: v })} />
        </div>
      );
    case "fillDates":
      return (
        <div className="grid grid-cols-2 gap-1.5">
          <Field label={dt("reports.designer.date_bucket_column", "Date bucket column")}>
            <ColumnSelect value={step.field} columns={columns} onChange={(v) => set({ field: v })} />
          </Field>
          <Field label={dt("common.range", "Range")} hint={dt("reports.designer.blank_from_the_first_to_the_last_date_in_the_dat", "Blank: from the first to the last date in the data")}>
            <div className="flex gap-1">
              {parameters.length > 0 && (
                <select
                  className={`${inputClass} w-auto! shrink-0 cursor-pointer`}
                  value={step.parameter ?? ""}
                  onKeyDown={(ev) => ev.stopPropagation()}
                  onChange={(ev) => set({ parameter: ev.target.value || null })}
                >
                  <option value="">{dt("common.days", "Days")}</option>
                  {parameters.map((p) => (
                    <option key={p.name} value={p.name}>
                      @{p.name}
                    </option>
                  ))}
                </select>
              )}
              {!step.parameter && <NumberInput value={step.count ?? null} min={1} placeholder={dt("reports.designer.last_n_days", "last N days")} onChange={(v) => set({ count: v })} />}
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
                  { value: "asc", label: dt("common.sort_ascending", "Ascending") },
                  { value: "desc", label: dt("common.sort_descending", "Descending") },
                ]}
                onChange={(v) => set({ sort: (step.sort ?? []).map((x, j) => (j === i ? { ...x, desc: v === "desc" } : x)) })}
              />
              <button
                type="button"
                className="p-1 text-gray-500 hover:text-danger cursor-pointer"
                onClick={() => set({ sort: (step.sort ?? []).filter((_, j) => j !== i) })}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white cursor-pointer"
            onClick={() => set({ sort: [...(step.sort ?? []), { field: columns[0]?.name ?? "", desc: true } as ReportSort] })}
          >
            <Plus size={12} /> {dt("reports.designer.sort_column", "Sort column")}
          </button>
        </div>
      );
    case "calculate":
      return (
        <div className="space-y-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            <Field label={dt("reports.designer.new_column_name", "New column name")}>
              <TextInput value={step.alias ?? ""} onChange={(v) => set({ alias: v.replace(/[^A-Za-z0-9_]/g, "") || null })} />
            </Field>
            <Field label={dt("common.type", "Type")}>
              <Select value={step.mode ?? "auto"} options={CALCULATED_TYPES} onChange={(v) => set({ mode: v === "auto" ? null : v })} />
            </Field>
          </div>
          <Field label={dt("reports.designer.expression", "Expression")}>
            <TextInput multiline rows={2} value={step.expression ?? ""} placeholder="watch / plays / 60" onChange={(v) => set({ expression: v })} />
          </Field>
          <p className="text-xs text-gray-500">
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
        <Field label={dt("reports.designer.rows", "Rows")} className="w-28">
          <NumberInput value={step.count ?? 10} min={0} onChange={(v) => set({ count: v ?? 10 })} />
        </Field>
      );
    default:
      // runningTotal, percentOfTotal, rank, change
      return (
        <div className="grid grid-cols-2 gap-1.5">
          <Field label={dt("reports.designer.of", "Of")}>
            <ColumnSelect value={step.field} columns={columns} onChange={(v) => set({ field: v })} />
          </Field>
          <Field label={dt("reports.designer.new_column_name", "New column name")}>
            <TextInput
              value={step.alias ?? ""}
              placeholder={`${step.field ?? "value"}_${step.type === "runningTotal" ? "running" : step.type === "percentOfTotal" ? "pct" : step.type}`}
              onChange={(v) => set({ alias: v || null })}
            />
          </Field>
          <Field label={dt("reports.designer.restart_for_each_optional", "Restart for each (optional)")}>
            <ColumnSelect value={step.partitionBy} columns={columns} optional={dt("reports.designer.whole_result", "Whole result")} onChange={(v) => set({ partitionBy: v })} />
          </Field>
          {step.type === "rank" && (
            <Field label={dt("reports.designer.rank_1_is", "Rank 1 is")}>
              <Select
                value={step.desc === false ? "lowest" : "highest"}
                options={[
                  { value: "highest", label: dt("reports.designer.highest", "Highest") },
                  { value: "lowest", label: dt("reports.designer.lowest", "Lowest") },
                ]}
                onChange={(v) => set({ desc: v === "highest" })}
              />
            </Field>
          )}
          {step.type === "change" && (
            <Field label={dt("reports.designer.as", "As")}>
              <Select
                value={step.mode ?? "difference"}
                options={[
                  { value: "difference", label: dt("reports.designer.difference", "Difference") },
                  { value: "percent", label: dt("reports.designer.percent_change", "% change") },
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
            <span className="text-xs font-mono text-gray-500">{i + 1}</span>
            <span className="text-xs font-bold text-gray-200 flex-1" title={TRANSFORM_LABELS[step.type]?.help}>
              {TRANSFORM_LABELS[step.type]?.label ?? step.type}
            </span>
            <button type="button" title={dt("reports.designer.move_up", "Move up")} className="p-0.5 text-gray-500 hover:text-white cursor-pointer" onClick={() => move(i, -1)}>
              <ArrowUp size={12} />
            </button>
            <button type="button" title={dt("reports.designer.move_down", "Move down")} className="p-0.5 text-gray-500 hover:text-white cursor-pointer" onClick={() => move(i, 1)}>
              <ArrowDown size={12} />
            </button>
            <button
              type="button"
              title={dt("reports.designer.remove_step", "Remove step")}
              className="p-0.5 text-gray-500 hover:text-danger cursor-pointer"
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
        <option value="">{dt("reports.designer.add_step", "+ Add step...")}</option>
        {(Object.keys(TRANSFORM_LABELS) as ReportTransformType[]).map((t) => (
          <option key={t} value={t}>
            {TRANSFORM_LABELS[t].label}
          </option>
        ))}
      </select>
    </div>
  );
}
