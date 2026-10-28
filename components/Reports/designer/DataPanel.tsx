import { AlertCircle, Copy, Database, Pencil, Plus, Trash2, Variable } from "lucide-react";
import { useState } from "react";
import type { ReportDataResult, ReportDataSource, ReportParameter } from "@/lib/models/reports";
import { newDataSource, newId } from "@/lib/reports/defaults";
import { Field, NumberInput, Section, Select, TextInput, useCapabilities } from "./controls";
import DataSourceEditor from "./DataSourceEditor";
import { useDesigner } from "./designerStore";

function DefaultValueInput({ parameter, onChange }: { parameter: ReportParameter; onChange: (v: unknown) => void }) {
  const v = parameter.defaultValue;
  switch (parameter.type) {
    case "number":
      return <NumberInput value={typeof v === "number" ? v : null} onChange={onChange} />;
    case "boolean":
      return (
        <Select
          value={v === true ? "true" : v === false ? "false" : ""}
          placeholder="(none)"
          options={[
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ]}
          onChange={(x) => onChange(x === "" ? null : x === "true")}
        />
      );
    case "date":
      return <TextInput value={typeof v === "string" ? v : ""} placeholder="2026-01-31" onChange={(x) => onChange(x || null)} />;
    default:
      return <TextInput value={v === null || v === undefined ? "" : String(v)} onChange={(x) => onChange(x || null)} />;
  }
}

export default function DataPanel({ data }: { data: Record<string, ReportDataResult> }) {
  const caps = useCapabilities();
  const { definition, change } = useDesigner();
  const [editing, setEditing] = useState<ReportDataSource | null>(null);

  const saveSource = (source: ReportDataSource) => {
    change((doc) => {
      const list = doc.definition.dataSources;
      const i = list.findIndex((d) => d.id === source.id);
      if (i >= 0) {
        list[i] = source;
      } else {
        list.push(source);
      }
    });
    setEditing(null);
  };

  const removeSource = (id: string) =>
    change((doc) => {
      doc.definition.dataSources = doc.definition.dataSources.filter((d) => d.id !== id);
      // Unbind elements that used it
      for (const page of doc.definition.pages) {
        for (const e of page.elements) {
          if (e.dataSourceId === id) {
            e.dataSourceId = null;
          }
        }
      }
    });

  const setParameter = (i: number, patch: Partial<ReportParameter>, key: string) =>
    change(
      (doc) => {
        Object.assign(doc.definition.parameters[i], patch);
      },
      { coalesceKey: `param-${i}-${key}` },
    );

  return (
    <div>
      <Section
        title="Data sources"
        actions={
          <button
            type="button"
            title="Add data source"
            className="p-1 text-gray-400 hover:text-white cursor-pointer"
            onClick={() => setEditing(newDataSource(`Data source ${definition.dataSources.length + 1}`, caps?.datasets[0]?.key ?? "activity"))}
          >
            <Plus size={14} />
          </button>
        }
      >
        {definition.dataSources.length === 0 && (
          <p className="text-xs text-gray-500">Add a data source, then bind tables, charts and metrics to it.</p>
        )}
        {definition.dataSources.map((ds) => {
          const result = data[ds.id];
          const label = caps?.datasets.find((d) => d.key === ds.dataset)?.label ?? ds.dataset;
          return (
            <div key={ds.id} className="group rounded-lg border border-border bg-background p-2.5 hover:border-gray-600">
              <div className="flex items-center gap-2">
                <Database size={14} className="text-brand-cyan shrink-0" />
                <button
                  type="button"
                  className="flex-1 min-w-0 text-left text-xs font-bold text-gray-200 truncate cursor-pointer hover:text-white"
                  onClick={() => setEditing(ds)}
                >
                  {ds.name}
                </button>
                <button type="button" title="Edit" className="p-0.5 text-gray-500 hover:text-white cursor-pointer" onClick={() => setEditing(ds)}>
                  <Pencil size={12} />
                </button>
                <button
                  type="button"
                  title="Duplicate"
                  className="p-0.5 text-gray-500 hover:text-white cursor-pointer"
                  onClick={() =>
                    change((doc) => {
                      doc.definition.dataSources.push({
                        ...structuredClone(ds),
                        id: newId(),
                        name: `${ds.name} (copy)`,
                      });
                    })
                  }
                >
                  <Copy size={12} />
                </button>
                <button
                  type="button"
                  title="Delete"
                  className="p-0.5 text-gray-500 hover:text-brand-rose cursor-pointer"
                  onClick={() => removeSource(ds.id)}
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-500">
                <span>{label}</span>
                <span className="uppercase text-[9px] tracking-wider border border-border rounded px-1">
                  {ds.engine === "gridify" ? "Gridify" : "EF Core"}
                </span>
                {result?.error ? (
                  <span className="flex items-center gap-1 text-brand-rose truncate" title={result.error}>
                    <AlertCircle size={11} /> error
                  </span>
                ) : result ? (
                  <span>
                    {result.rows.length}
                    {result.truncated ? "+" : ""} rows
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </Section>

      <Section
        title="Parameters"
        actions={
          <button
            type="button"
            title="Add parameter"
            className="p-1 text-gray-400 hover:text-white cursor-pointer"
            onClick={() =>
              change((doc) => {
                doc.definition.parameters.push({
                  name: `param${doc.definition.parameters.length + 1}`,
                  label: null,
                  type: "string",
                  defaultValue: null,
                });
              })
            }
          >
            <Plus size={14} />
          </button>
        }
      >
        <p className="text-[11px] text-gray-500">
          Use in filters (pick @name as the value) and text as {"{{param.name}}"}. Viewers and schedules can change them.
        </p>
        {definition.parameters.map((p, i) => (
          <div key={i} className="rounded-lg border border-border bg-background p-2.5 space-y-2">
            <div className="flex items-center gap-2">
              <Variable size={14} className="text-brand-amber shrink-0" />
              <span className="flex-1 text-xs font-bold text-gray-200 truncate">@{p.name}</span>
              <button
                type="button"
                title="Delete"
                className="p-0.5 text-gray-500 hover:text-brand-rose cursor-pointer"
                onClick={() =>
                  change((doc) => {
                    doc.definition.parameters.splice(i, 1);
                  })
                }
              >
                <Trash2 size={12} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Name">
                <TextInput value={p.name} onChange={(v) => setParameter(i, { name: v.replace(/[^A-Za-z0-9_]/g, "") }, "name")} />
              </Field>
              <Field label="Type">
                <Select
                  value={p.type}
                  options={[
                    { value: "string", label: "Text" },
                    { value: "number", label: "Number" },
                    { value: "date", label: "Date" },
                    { value: "boolean", label: "Yes/No" },
                  ]}
                  onChange={(v) => setParameter(i, { type: v, defaultValue: null }, "type")}
                />
              </Field>
              <Field label="Label">
                <TextInput value={p.label ?? ""} onChange={(v) => setParameter(i, { label: v || null }, "label")} />
              </Field>
              <Field label="Default">
                <DefaultValueInput parameter={p} onChange={(v) => setParameter(i, { defaultValue: v }, "default")} />
              </Field>
            </div>
          </div>
        ))}
      </Section>

      {editing && <DataSourceEditor source={editing} parameters={definition.parameters} onApply={saveSource} onClose={() => setEditing(null)} />}
    </div>
  );
}
