import { Plus, Trash2 } from "lucide-react";
import type { ReportCalculatedField, ReportFieldInfo } from "@/lib/models/reports";
import { Select, TextInput } from "./controls";

export const CALCULATED_TYPES = [
  { value: "auto", label: "Automatic" },
  { value: "number", label: "Number" },
  { value: "integer", label: "Whole number" },
  { value: "string", label: "Text" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Yes/No" },
  { value: "duration", label: "Duration (seconds)" },
  { value: "bytes", label: "Bytes" },
];

export const EXPRESSION_HELP =
  "Use field names, + - * / %, comparisons, && || !, ?? for a fallback, iif(condition, a, b), " +
  "text functions (ToLower, ToUpper, Trim, Substring, Replace, Contains, StartsWith), Math.Round/Abs/Floor/Ceiling/Max/Min, " +
  "and dates (.Year .Month .Day .Hour .DayOfWeek, AddDays). Write 3600.0 rather than 3600 for decimal division.";

/** Row-level calculated fields; they can be used anywhere a dataset field can (filters, groups, values, sort, output). */
export default function CalculatedFieldsEditor({
  calculated,
  fields,
  onChange,
}: {
  calculated: ReportCalculatedField[];
  fields: ReportFieldInfo[];
  onChange: (calculated: ReportCalculatedField[]) => void;
}) {
  const set = (i: number, patch: Partial<ReportCalculatedField>) => onChange(calculated.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  return (
    <div className="space-y-2">
      {calculated.map((c, i) => (
        <div key={i} className="rounded-lg border border-border bg-background/40 p-2 space-y-1.5">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)_auto] gap-1.5">
            <TextInput value={c.name} placeholder="Name" onChange={(v) => set(i, { name: v.replace(/[^A-Za-z0-9_]/g, "") })} />
            <TextInput value={c.label ?? ""} placeholder="Label (optional)" onChange={(v) => set(i, { label: v || null })} />
            <Select value={c.type ?? "auto"} options={CALCULATED_TYPES} onChange={(v) => set(i, { type: v === "auto" ? null : v })} />
            <button
              type="button"
              title="Remove"
              className="p-1 text-gray-500 hover:text-brand-rose cursor-pointer"
              onClick={() => onChange(calculated.filter((_, j) => j !== i))}
            >
              <Trash2 size={12} />
            </button>
          </div>
          <TextInput multiline rows={2} value={c.expression} placeholder="Duration / 3600.0" onChange={(v) => set(i, { expression: v })} />
        </div>
      ))}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white cursor-pointer"
          onClick={() => onChange([...calculated, { name: `Calc${calculated.length + 1}`, expression: "", type: null, label: null }])}
        >
          <Plus size={12} /> Calculated field
        </button>
      </div>
      {calculated.length > 0 && (
        <details className="text-[11px] text-gray-500">
          <summary className="cursor-pointer hover:text-gray-300">Expression help</summary>
          <p className="mt-1">{EXPRESSION_HELP}</p>
          <p className="mt-1">
            Fields: <span className="text-gray-400">{fields.map((f) => f.key).join(", ")}</span>
          </p>
          <p className="mt-1">
            Examples: <code className="text-gray-300">Duration / 3600.0</code> ·{" "}
            <code className="text-gray-300">iif(CompletionPercentage &gt;= 90, &quot;Finished&quot;, &quot;Partial&quot;)</code> ·{" "}
            <code className="text-gray-300">SeriesName ?? Name</code> · <code className="text-gray-300">DateCreated.Hour</code>
          </p>
        </details>
      )}
    </div>
  );
}
