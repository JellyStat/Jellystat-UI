import { Plus, Trash2 } from "lucide-react";
import clsx from "clsx";
import type { ReportColumn, ReportDataSource, ReportDerive } from "@/lib/models/reports";
import { Field, Select, TextInput } from "./controls";

/** Settings for a data source built from other data sources: a join on matching columns, or a union of rows. */
export default function CombineEditor({
  derive,
  others,
  columnsOf,
  onChange,
}: {
  derive: ReportDerive;
  /** The report's other data sources. */
  others: ReportDataSource[];
  columnsOf: (sourceId: string) => ReportColumn[];
  onChange: (derive: ReportDerive) => void;
}) {
  const set = (patch: Partial<ReportDerive>) => onChange({ ...derive, ...patch });
  const sourceOptions = others.map((d) => ({ value: d.id, label: d.name }));
  const [left, right] = [derive.sources[0] ?? "", derive.sources[1] ?? ""];
  const leftColumns = left ? columnsOf(left) : [];
  const rightColumns = right ? columnsOf(right) : [];
  const columnOptions = (cols: ReportColumn[]) => cols.map((c) => ({ value: c.name, label: c.label === c.name ? c.name : `${c.label} (${c.name})` }));

  if (others.length === 0) {
    return <p className="text-xs text-gray-500">Add other data sources first; this one combines their results.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex rounded-lg border border-border overflow-hidden text-xs font-bold w-fit">
        {[
          { value: "join", label: "Join (match rows)" },
          { value: "union", label: "Union (stack rows)" },
        ].map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => set({ mode: m.value as ReportDerive["mode"], sources: m.value === "join" ? derive.sources.slice(0, 2) : derive.sources })}
            className={clsx("px-3 py-1.5 cursor-pointer", derive.mode === m.value ? "bg-brand-purple text-white" : "text-gray-400 hover:text-white")}
          >
            {m.label}
          </button>
        ))}
      </div>

      {derive.mode === "join" ? (
        <>
          <p className="text-[11px] text-gray-500">
            Adds the right source&apos;s columns to each matching row of the left source, e.g. this month&apos;s plays next to last month&apos;s per
            user.
          </p>
          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
            <Field label="Left">
              <Select value={left} placeholder="Choose..." options={sourceOptions} onChange={(v) => set({ sources: [v, right], on: [] })} />
            </Field>
            <Field label="Join">
              <Select
                value={derive.joinType ?? "left"}
                options={[
                  { value: "left", label: "Keep all left rows" },
                  { value: "inner", label: "Only matches" },
                  { value: "full", label: "Keep all rows" },
                ]}
                onChange={(v) => set({ joinType: v as ReportDerive["joinType"] })}
              />
            </Field>
            <Field label="Right">
              <Select value={right} placeholder="Choose..." options={sourceOptions} onChange={(v) => set({ sources: [left, v], on: [] })} />
            </Field>
          </div>
          <Field label="Match on">
            <div className="space-y-1.5">
              {derive.on.map((k, i) => (
                <div key={i} className="grid grid-cols-[1fr_auto_1fr_auto] gap-1.5 items-center">
                  <Select
                    value={k.left}
                    placeholder="Left column"
                    options={columnOptions(leftColumns)}
                    onChange={(v) => set({ on: derive.on.map((x, j) => (j === i ? { ...x, left: v } : x)) })}
                  />
                  <span className="text-xs text-gray-500">=</span>
                  <Select
                    value={k.right}
                    placeholder="Right column"
                    options={columnOptions(rightColumns)}
                    onChange={(v) => set({ on: derive.on.map((x, j) => (j === i ? { ...x, right: v } : x)) })}
                  />
                  <button
                    type="button"
                    className="p-1 text-gray-500 hover:text-brand-rose cursor-pointer"
                    onClick={() => set({ on: derive.on.filter((_, j) => j !== i) })}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                disabled={!left || !right}
                className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white cursor-pointer disabled:opacity-40"
                onClick={() => {
                  // Suggest a column both sides share
                  const shared = leftColumns.find((c) => rightColumns.some((r) => r.name.toLowerCase() === c.name.toLowerCase()));
                  set({
                    on: [
                      ...derive.on,
                      {
                        left: shared?.name ?? leftColumns[0]?.name ?? "",
                        right: shared
                          ? rightColumns.find((r) => r.name.toLowerCase() === shared.name.toLowerCase())!.name
                          : (rightColumns[0]?.name ?? ""),
                      },
                    ],
                  });
                }}
              >
                <Plus size={12} /> Column pair
              </button>
            </div>
          </Field>
          <Field label="Prefix for clashing right-hand columns" hint="Default: the right source's name and _">
            <TextInput
              value={derive.rightPrefix ?? ""}
              placeholder={`${others.find((o) => o.id === right)?.name.replace(/[^A-Za-z0-9_]+/g, "_") ?? "right"}_`}
              onChange={(v) => set({ rightPrefix: v || null })}
            />
          </Field>
        </>
      ) : (
        <>
          <p className="text-[11px] text-gray-500">All rows of each chosen source, one after another; columns with the same name line up.</p>
          <Field label="Sources">
            <div className="grid grid-cols-2 gap-1">
              {others.map((o) => (
                <label key={o.id} className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    className="accent-brand-purple"
                    checked={derive.sources.includes(o.id)}
                    onChange={(ev) => set({ sources: ev.target.checked ? [...derive.sources, o.id] : derive.sources.filter((x) => x !== o.id) })}
                  />
                  <span className="truncate">{o.name}</span>
                </label>
              ))}
            </div>
          </Field>
          <Field label="Column naming each row's source (optional)">
            <TextInput
              value={derive.sourceColumn ?? ""}
              placeholder="e.g. Source"
              onChange={(v) => set({ sourceColumn: v.replace(/[^A-Za-z0-9_]/g, "") || null })}
            />
          </Field>
        </>
      )}
    </div>
  );
}
