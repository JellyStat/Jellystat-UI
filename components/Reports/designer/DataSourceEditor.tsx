import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import clsx from "clsx";
import { ArrowDown, ArrowUp, Database, Loader2, Play, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import client from "@/lib/api";
import type { ReportDataResult, ReportDataSource, ReportParameter } from "@/lib/models/reports";
import { dataSourceColumns, isGrouped, sourceFields } from "@/lib/reports/columns";
import CalculatedFieldsEditor from "./CalculatedFieldsEditor";
import CombineEditor from "./CombineEditor";
import TransformsEditor from "./TransformsEditor";
import { formatValue } from "@/lib/reports/format";
import { Field, inputClass, NumberInput, Select, TextInput, useCapabilities } from "./controls";
import FilterBuilder from "./FilterBuilder";

interface Props {
  source: ReportDataSource;
  /** The report's data sources (including this one), which a combined source is built from. */
  allSources: ReportDataSource[];
  parameters: ReportParameter[];
  /** The report's time zone, so the preview buckets dates like the report will. */
  timeZone?: string | null;
  onApply: (source: ReportDataSource) => void;
  onClose: () => void;
}

const AGGREGATE_LABELS: Record<string, string> = {
  count: "Count",
  countDistinct: "Count distinct",
  sum: "Sum",
  avg: "Average",
  min: "Minimum",
  max: "Maximum",
};

const BUCKET_LABELS: Record<string, string> = {
  hour: "Hour",
  day: "Day",
  weekday: "Day of week",
  hourOfDay: "Hour of day",
  month: "Month",
  year: "Year",
};

export default function DataSourceEditor({ source, allSources, parameters, timeZone, onApply, onClose }: Props) {
  const caps = useCapabilities();
  const [draft, setDraft] = useState<ReportDataSource>(source);
  const [grouped, setGrouped] = useState(isGrouped(source));
  const [preview, setPreview] = useState<ReportDataResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dataset = caps?.datasets.find((d) => d.key === draft.dataset);
  const fields = sourceFields(dataset, draft.calculated);
  const derived = !!draft.derive;
  const others = allSources.filter((d) => d.id !== draft.id);
  const set = (patch: Partial<ReportDataSource>) => setDraft((d) => ({ ...d, ...patch }));
  // Switching modes clears the other mode's settings so the saved definition has no leftovers
  const final = (): ReportDataSource => {
    if (derived) {
      return { ...draft, fields: [], groupBy: [], aggregates: [], sort: [], filter: null, gridifyFilter: null, calculated: [] };
    }
    const d = { ...draft, derive: null, calculated: (draft.calculated ?? []).filter((c) => c.name.trim() || c.expression.trim()) };
    return grouped ? { ...d, fields: [] } : { ...d, groupBy: [], aggregates: [] };
  };
  const columnsWith = (ds: ReportDataSource) => dataSourceColumns(ds, caps, [...others, ds]);
  const outputColumns = columnsWith(final());
  // What the query (or the combine) returns, before any post-query steps: the only columns SQL can sort on
  const queryColumns = columnsWith({ ...final(), transforms: [] });

  const run = async () => {
    setRunning(true);
    setError(null);
    try {
      setPreview(
        await client.Reports.query({
          dataSource: final(),
          dataSources: others,
          parameterDefinitions: parameters,
          maxRows: 100,
          timeZone,
        }),
      );
    } catch (err: any) {
      setError(err?.message ?? "Query failed");
      setPreview(null);
    } finally {
      setRunning(false);
    }
  };

  const moveItem = <T,>(list: T[], i: number, dir: -1 | 1): T[] => {
    const next = [...list];
    const j = i + dir;
    if (j < 0 || j >= next.length) {
      return next;
    }
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  };

  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-6">
        <DialogPanel className="w-full max-w-6xl h-full max-h-[92dvh] flex flex-col rounded-2xl border border-border bg-surface shadow-2xl shadow-black/40 overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-lg font-black text-white">
              <Database size={20} className="text-brand-purple" /> Data source
            </DialogTitle>
            <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-white cursor-pointer" aria-label="Close">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 min-h-0 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] overflow-hidden">
            {/* Settings */}
            <div className="overflow-y-auto p-5 space-y-5 border-b lg:border-b-0 lg:border-r border-border">
              <div className="flex rounded-lg border border-border overflow-hidden text-xs font-bold w-fit">
                {[
                  { value: false, label: "Query a dataset" },
                  { value: true, label: "Combine data sources" },
                ].map((m) => (
                  <button
                    key={m.label}
                    type="button"
                    onClick={() => set({ derive: m.value ? (draft.derive ?? { mode: "join", sources: [], on: [], joinType: "left" }) : null })}
                    className={clsx(
                      "px-3 py-1.5 cursor-pointer",
                      derived === m.value ? "bg-brand-purple text-white" : "text-gray-400 hover:text-white",
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Name">
                  <TextInput value={draft.name} onChange={(v) => set({ name: v })} />
                </Field>
                {!derived && (
                  <Field label="Dataset">
                    <Select
                      value={draft.dataset}
                      options={(caps?.datasets ?? []).map((d) => ({ value: d.key, label: d.label }))}
                      onChange={(v) =>
                        set({
                          dataset: v,
                          fields: [],
                          groupBy: [],
                          aggregates: [],
                          sort: [],
                          filter: { combinator: "and", rules: [] },
                          calculated: [],
                        })
                      }
                    />
                  </Field>
                )}
              </div>

              {derived && (
                <CombineEditor
                  derive={draft.derive!}
                  others={others}
                  columnsOf={(id) => {
                    const ds = others.find((o) => o.id === id);
                    return ds ? columnsWith(ds) : [];
                  }}
                  onChange={(derive) => set({ derive })}
                />
              )}

              {!derived && (
                <>
                  {dataset && <p className="text-xs text-gray-500 -mt-3">{dataset.description}</p>}

                  <Field label="Calculated fields" hint="Computed per row in the database; use them like any other field">
                    <CalculatedFieldsEditor
                      calculated={draft.calculated ?? []}
                      fields={dataset?.fields ?? []}
                      onChange={(calculated) => set({ calculated })}
                    />
                  </Field>

                  <Field label="Query engine" hint="Both run as SQL in the database and give the same results">
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          {
                            key: "efcore",
                            title: "EF Core",
                            text: "Filters compile to LINQ expression trees.",
                          },
                          {
                            key: "gridify",
                            title: "Gridify",
                            text: "Filters translate to Gridify syntax; also accepts raw Gridify.",
                          },
                        ] as const
                      ).map((e) => (
                        <button
                          key={e.key}
                          type="button"
                          onClick={() =>
                            set({
                              engine: e.key,
                              gridifyFilter: e.key === "gridify" ? draft.gridifyFilter : null,
                            })
                          }
                          className={clsx(
                            "text-left p-2.5 rounded-lg border cursor-pointer transition-colors",
                            draft.engine === e.key ? "border-brand-purple bg-brand-purple/10" : "border-border hover:border-gray-600",
                          )}
                        >
                          <div className="text-xs font-bold text-white">{e.title}</div>
                          <div className="text-[11px] text-gray-500">{e.text}</div>
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="Filter">
                    <FilterBuilder
                      node={draft.filter ?? { combinator: "and", rules: [] }}
                      fields={fields}
                      parameters={parameters}
                      onChange={(filter) => set({ filter })}
                    />
                  </Field>

                  {draft.engine === "gridify" && (
                    <Field label="Raw Gridify filter (optional)" hint="Combined with the filter above using AND">
                      <TextInput
                        value={draft.gridifyFilter ?? ""}
                        placeholder="UserName=*bob/i,Duration>600"
                        onChange={(v) => set({ gridifyFilter: v || null })}
                      />
                      <span className="text-[11px] text-gray-500">
                        Fields: {fields.map((f) => f.key).join(", ")}. Operators: = != &gt; &lt; &gt;= &lt;= =* !* ^ $, combine with , (and) | (or)
                        and ( ).
                      </span>
                    </Field>
                  )}

                  <div className="flex rounded-lg border border-border overflow-hidden text-xs font-bold w-fit">
                    {[
                      { value: false, label: "Rows" },
                      { value: true, label: "Summary (group & aggregate)" },
                    ].map((m) => (
                      <button
                        key={m.label}
                        type="button"
                        onClick={() => {
                          setGrouped(m.value);
                          set({ sort: [] });
                        }}
                        className={clsx(
                          "px-3 py-1.5 cursor-pointer",
                          grouped === m.value ? "bg-brand-purple text-white" : "text-gray-400 hover:text-white",
                        )}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {!grouped && (
                    <Field label="Columns (none ticked = all)">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                        {fields.map((f) => (
                          <label
                            key={f.key}
                            className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer"
                            title={f.description ?? undefined}
                          >
                            <input
                              type="checkbox"
                              className="accent-brand-purple"
                              checked={draft.fields.includes(f.key)}
                              onChange={(ev) =>
                                set({
                                  fields: ev.target.checked ? [...draft.fields, f.key] : draft.fields.filter((x) => x !== f.key),
                                })
                              }
                            />
                            <span className="truncate">{f.label}</span>
                          </label>
                        ))}
                      </div>
                    </Field>
                  )}

                  {grouped && (
                    <>
                      <Field label="Group by">
                        <div className="space-y-1.5">
                          {draft.groupBy.map((g, i) => {
                            const f = fields.find((x) => x.key === g.field);
                            return (
                              <div key={i} className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-1.5">
                                <Select
                                  value={g.field}
                                  options={fields.filter((x) => x.groupable).map((x) => ({ value: x.key, label: x.label }))}
                                  onChange={(v) =>
                                    set({
                                      groupBy: draft.groupBy.map((x, j) =>
                                        j === i
                                          ? {
                                              ...x,
                                              field: v,
                                              bucket: fields.find((ff) => ff.key === v)?.type === "date" ? "day" : null,
                                            }
                                          : x,
                                      ),
                                    })
                                  }
                                />
                                {f?.type === "date" ? (
                                  <Select
                                    value={g.bucket ?? "day"}
                                    options={(caps?.dateBuckets ?? []).map((b) => ({
                                      value: b,
                                      label: BUCKET_LABELS[b] ?? b,
                                    }))}
                                    onChange={(v) =>
                                      set({
                                        groupBy: draft.groupBy.map((x, j) => (j === i ? { ...x, bucket: v } : x)),
                                      })
                                    }
                                  />
                                ) : (
                                  <div />
                                )}
                                <TextInput
                                  value={g.alias ?? ""}
                                  placeholder="column name"
                                  onChange={(v) =>
                                    set({
                                      groupBy: draft.groupBy.map((x, j) => (j === i ? { ...x, alias: v || null } : x)),
                                    })
                                  }
                                />
                                <button
                                  type="button"
                                  className="p-1 text-gray-500 hover:text-brand-rose cursor-pointer"
                                  onClick={() => set({ groupBy: draft.groupBy.filter((_, j) => j !== i) })}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            );
                          })}
                          {draft.groupBy.length < 4 && (
                            <button
                              type="button"
                              className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white cursor-pointer"
                              onClick={() => {
                                const f = fields.find((x) => x.groupable);
                                if (f) {
                                  set({
                                    groupBy: [...draft.groupBy, { field: f.key, bucket: f.type === "date" ? "day" : null }],
                                  });
                                }
                              }}
                            >
                              <Plus size={12} /> Group
                            </button>
                          )}
                        </div>
                      </Field>

                      <Field label="Values">
                        <div className="space-y-1.5">
                          {draft.aggregates.map((a, i) => (
                            <div key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)_auto] gap-1.5">
                              <Select
                                value={a.fn}
                                options={(caps?.aggregates ?? []).map((x) => ({
                                  value: x,
                                  label: AGGREGATE_LABELS[x] ?? x,
                                }))}
                                onChange={(v) =>
                                  set({
                                    aggregates: draft.aggregates.map((x, j) =>
                                      j === i
                                        ? {
                                            ...x,
                                            fn: v,
                                            field: v === "count" ? null : (x.field ?? fields.find((ff) => ff.aggregatable)?.key),
                                          }
                                        : x,
                                    ),
                                  })
                                }
                              />
                              <Select
                                value={a.field ?? ""}
                                placeholder={a.fn === "count" ? "rows" : undefined}
                                options={fields
                                  .filter((x) => a.fn === "count" || a.fn === "countDistinct" || x.aggregatable)
                                  .filter((x) => !(a.fn === "sum" || a.fn === "avg") || x.type !== "date")
                                  .map((x) => ({ value: x.key, label: x.label }))}
                                onChange={(v) =>
                                  set({
                                    aggregates: draft.aggregates.map((x, j) => (j === i ? { ...x, field: v || null } : x)),
                                  })
                                }
                              />
                              <TextInput
                                value={a.alias ?? ""}
                                placeholder="column name"
                                onChange={(v) =>
                                  set({
                                    aggregates: draft.aggregates.map((x, j) => (j === i ? { ...x, alias: v || null } : x)),
                                  })
                                }
                              />
                              <button
                                type="button"
                                className="p-1 text-gray-500 hover:text-brand-rose cursor-pointer"
                                onClick={() => set({ aggregates: draft.aggregates.filter((_, j) => j !== i) })}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white cursor-pointer"
                            onClick={() =>
                              set({
                                aggregates: [
                                  ...draft.aggregates,
                                  {
                                    fn: "count",
                                    alias: draft.aggregates.length ? `count${draft.aggregates.length + 1}` : "count",
                                  },
                                ],
                              })
                            }
                          >
                            <Plus size={12} /> Value
                          </button>
                        </div>
                      </Field>
                    </>
                  )}

                  <Field label="Sort">
                    <div className="space-y-1.5">
                      {draft.sort.map((s, i) => (
                        <div key={i} className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto_auto] gap-1.5 items-center">
                          <Select
                            value={s.field}
                            options={
                              grouped
                                ? queryColumns.map((c) => ({ value: c.name, label: c.label }))
                                : fields.map((f) => ({ value: f.key, label: f.label }))
                            }
                            onChange={(v) =>
                              set({
                                sort: draft.sort.map((x, j) => (j === i ? { ...x, field: v } : x)),
                              })
                            }
                          />
                          <select
                            className={clsx(inputClass, "w-auto!")}
                            value={s.desc ? "desc" : "asc"}
                            onKeyDown={(ev) => ev.stopPropagation()}
                            onChange={(ev) =>
                              set({
                                sort: draft.sort.map((x, j) => (j === i ? { ...x, desc: ev.target.value === "desc" } : x)),
                              })
                            }
                          >
                            <option value="asc">Ascending</option>
                            <option value="desc">Descending</option>
                          </select>
                          <button
                            type="button"
                            className="p-1 text-gray-500 hover:text-white cursor-pointer"
                            onClick={() => set({ sort: moveItem(draft.sort, i, -1) })}
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            type="button"
                            className="p-1 text-gray-500 hover:text-white cursor-pointer"
                            onClick={() => set({ sort: moveItem(draft.sort, i, 1) })}
                          >
                            <ArrowDown size={12} />
                          </button>
                          <button
                            type="button"
                            className="p-1 text-gray-500 hover:text-brand-rose cursor-pointer"
                            onClick={() => set({ sort: draft.sort.filter((_, j) => j !== i) })}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white cursor-pointer"
                        onClick={() => {
                          const first = grouped ? queryColumns[0]?.name : fields[0]?.key;
                          if (first) {
                            set({ sort: [...draft.sort, { field: first, desc: true }] });
                          }
                        }}
                      >
                        <Plus size={12} /> Sort
                      </button>
                    </div>
                  </Field>
                </>
              )}

              <Field label="After the query" hint="Steps applied to the result, in order">
                <TransformsEditor
                  transforms={draft.transforms ?? []}
                  columns={queryColumns}
                  resultColumns={preview?.error ? null : preview?.columns}
                  parameters={parameters}
                  onChange={(transforms) => set({ transforms })}
                />
              </Field>

              {!derived && (
                <Field label={`Row limit (max ${caps?.maxRows ?? 10000})`}>
                  <div className="w-32">
                    <NumberInput value={draft.limit ?? 1000} min={1} max={caps?.maxRows ?? 10000} onChange={(v) => set({ limit: v ?? 1000 })} />
                  </div>
                </Field>
              )}
            </div>

            {/* Preview */}
            <div className="flex flex-col min-h-0 p-5 gap-3">
              <div className="flex items-start gap-3">
                {/* Wraps (and scrolls past a few lines) so the button always stays in view */}
                <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-1.5 gap-y-1 max-h-16 overflow-y-auto text-xs text-gray-400">
                  <span>Columns:</span>
                  {outputColumns.map((c) => (
                    <code key={c.name} className="text-gray-300 break-all">
                      {c.name}
                    </code>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={run}
                  disabled={running}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-purple/15 border border-brand-purple/40 text-brand-purple hover:bg-brand-purple hover:text-white text-xs font-bold cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Run preview
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-auto rounded-lg border border-border bg-background">
                {error && <p className="p-4 text-xs text-brand-rose">{error}</p>}
                {preview?.error && <p className="p-4 text-xs text-brand-rose">{preview.error}</p>}
                {!preview && !error && <p className="p-4 text-xs text-gray-500">Run the query to see the first 100 rows.</p>}
                {preview && !preview.error && (
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-surface">
                      <tr>
                        {preview.columns.map((c) => (
                          <th key={c.name} className="text-left font-bold text-gray-300 px-2 py-1.5 border-b border-border whitespace-nowrap">
                            {c.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.map((row, r) => (
                        <tr key={r} className="border-b border-border/40">
                          {preview.columns.map((c) => (
                            <td key={c.name} className="px-2 py-1 text-gray-400 whitespace-nowrap max-w-[240px] truncate">
                              {formatValue(row[c.name], null, c.type, timeZone)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              {preview && !preview.error && (
                <p className="text-[11px] text-gray-500">
                  {preview.rows.length} rows{preview.truncated ? " (more available)" : ""} in {preview.elapsedMs} ms
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 px-5 py-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-background border border-border text-gray-200 hover:text-white text-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onApply(final())}
              disabled={!draft.name.trim()}
              className="px-4 py-2 rounded-lg bg-brand-purple text-white text-sm font-bold hover:bg-brand-purple/90 cursor-pointer disabled:opacity-50"
            >
              Apply
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
