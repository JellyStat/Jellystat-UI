import { AlertCircle, Copy, Database, Pencil, Plus, Trash2, Variable } from "lucide-react";
import { useState } from "react";
import type { ReportDataResult, ReportDataSource, ReportParameter } from "@/lib/models/reports";
import { dataSourceColumns } from "@/lib/reports/columns";
import { newDataSource, newId } from "@/lib/reports/defaults";
import ParameterInput from "../ParameterInput";
import { Field, NumberInput, Section, Select, TextInput, Toggle, useCapabilities } from "./controls";
import DataSourceEditor from "./DataSourceEditor";
import { useDesigner } from "./designerStore";
import { dt } from "./i18n";

function DefaultValueInput({ parameter, onChange }: { parameter: ReportParameter; onChange: (v: unknown) => void }) {
  const { definition } = useDesigner();
  const v = parameter.defaultValue;
  switch (parameter.type) {
    case "lookup":
      return <ParameterInput parameter={parameter} value={v} onChange={onChange} source={{ definition }} size="sm" emptyLabel={dt("reports.designer.all", "All")} />;
    case "number":
      return <NumberInput value={typeof v === "number" ? v : null} onChange={onChange} />;
    case "boolean":
      return (
        <Select
          value={v === true ? "true" : v === false ? "false" : ""}
          placeholder={dt("reports.designer.none_2", "(none)")}
          options={[
            { value: "true", label: dt("reports.designer.yes", "Yes") },
            { value: "false", label: dt("reports.designer.no", "No") },
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

/** Where a lookup parameter's dropdown gets its choices: a column of one of the report's data sources. */
function LookupSettings({
  parameter,
  onChange,
}: {
  parameter: ReportParameter;
  onChange: (lookup: NonNullable<ReportParameter["lookup"]>, key: string) => void;
}) {
  const caps = useCapabilities();
  const { definition } = useDesigner();
  const lookup = parameter.lookup ?? { dataSourceId: "", valueField: "", labelField: null, multiple: false };
  const columns = dataSourceColumns(
    definition.dataSources.find((d) => d.id === lookup.dataSourceId),
    caps,
    definition.dataSources,
  ).map((c) => ({ value: c.name, label: c.label }));
  const usedBy = definition.dataSources.filter((d) => JSON.stringify(d.filter ?? {}).includes(`"parameter":"${parameter.name}"`)).length;

  return (
    <div className="rounded-md border border-warning/20 bg-warning/5 p-2 space-y-2">
      <Field label={dt("reports.designer.choices_from", "Choices from")}>
        <Select
          value={lookup.dataSourceId}
          placeholder={dt("reports.designer.choose_a_data_source", "Choose a data source...")}
          options={definition.dataSources.map((d) => ({ value: d.id, label: d.name }))}
          onChange={(v) => onChange({ ...lookup, dataSourceId: v, valueField: "", labelField: null }, "source")}
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label={dt("reports.designer.value_column", "Value column")} hint={dt("reports.designer.passed_to_filters", "Passed to filters")}>
          <Select
            value={lookup.valueField}
            placeholder={dt("reports.designer.choose", "Choose...")}
            options={columns}
            onChange={(v) => onChange({ ...lookup, valueField: v }, "value")}
          />
        </Field>
        <Field label={dt("reports.designer.label_column", "Label column")} hint={dt("reports.designer.shown_in_the_dropdown", "Shown in the dropdown")}>
          <Select
            value={lookup.labelField ?? ""}
            placeholder={dt("reports.designer.same_as_value", "Same as value")}
            options={columns}
            onChange={(v) => onChange({ ...lookup, labelField: v || null }, "label")}
          />
        </Field>
      </div>
      <Toggle label={dt("reports.designer.allow_several_choices", "Allow several choices")} checked={!!lookup.multiple} onChange={(v) => onChange({ ...lookup, multiple: v }, "multiple")} />
      <p className="text-xs text-gray-500">
        {usedBy === 0
          ? dt(
              "reports.designer.parameter_not_used",
              "Not used yet: in a data source filter, pick @{{name}} as the value (use 'equals' / 'is one of').",
              { name: parameter.name },
            )
          : dt(
              "reports.designer.parameter_used_by",
              "Used by {{count}} data source filter(s). Leaving it empty switches those filters off.",
              { count: usedBy },
            )}
      </p>
    </div>
  );
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
        title={dt("reports.designer.data_sources", "Data sources")}
        actions={
          <button
            type="button"
            title={dt("reports.designer.add_data_source", "Add data source")}
            className="p-1 text-gray-400 hover:text-white cursor-pointer"
            onClick={() => setEditing(newDataSource(dt("reports.designer.data_source_n", "Data source {{n}}", { n: definition.dataSources.length + 1 }), caps?.datasets[0]?.key ?? "activity"))}
          >
            <Plus size={14} />
          </button>
        }
      >
        {definition.dataSources.length === 0 && (
          <p className="text-xs text-gray-500">{dt("reports.designer.add_a_data_source_then_bind_tables_charts_and_me", "Add a data source, then bind tables, charts and metrics to it.")}</p>
        )}
        {definition.dataSources.map((ds) => {
          const result = data[ds.id];
          const label = ds.derive
            ? `Combined (${ds.derive.mode}): ${ds.derive.sources.map((id) => definition.dataSources.find((d) => d.id === id)?.name ?? "?").join(", ")}`
            : (caps?.datasets.find((d) => d.key === ds.dataset)?.label ?? ds.dataset);
          return (
            <div key={ds.id} className="group rounded-lg border border-border bg-background p-2.5 hover:border-gray-600">
              <div className="flex items-center gap-2">
                <Database size={14} className="text-accent shrink-0" />
                <button
                  type="button"
                  className="flex-1 min-w-0 text-left text-xs font-bold text-gray-200 truncate cursor-pointer hover:text-white"
                  onClick={() => setEditing(ds)}
                >
                  {ds.name}
                </button>
                <button type="button" title={dt("reports.designer.edit", "Edit")} className="p-0.5 text-gray-500 hover:text-white cursor-pointer" onClick={() => setEditing(ds)}>
                  <Pencil size={12} />
                </button>
                <button
                  type="button"
                  title={dt("reports.designer.duplicate", "Duplicate")}
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
                  title={dt("reports.designer.delete", "Delete")}
                  className="p-0.5 text-gray-500 hover:text-danger cursor-pointer"
                  onClick={() => removeSource(ds.id)}
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                <span>{label}</span>
                {result?.error ? (
                  <span className="flex items-center gap-1 text-danger truncate" title={result.error}>
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
        title={dt("reports.designer.parameters", "Parameters")}
        actions={
          <button
            type="button"
            title={dt("reports.designer.add_parameter", "Add parameter")}
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
        <p className="text-xs text-gray-500">
          Use in filters (pick @name as the value) and text as {"{{param.name}}"}. Viewers and schedules can change them.
        </p>
        {definition.parameters.map((p, i) => (
          <div key={i} className="rounded-lg border border-border bg-background p-2.5 space-y-2">
            <div className="flex items-center gap-2">
              <Variable size={14} className="text-warning shrink-0" />
              <span className="flex-1 text-xs font-bold text-gray-200 truncate">@{p.name}</span>
              <button
                type="button"
                title={dt("reports.designer.delete", "Delete")}
                className="p-0.5 text-gray-500 hover:text-danger cursor-pointer"
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
              <Field label={dt("reports.designer.name", "Name")}>
                <TextInput value={p.name} onChange={(v) => setParameter(i, { name: v.replace(/[^A-Za-z0-9_]/g, "") }, "name")} />
              </Field>
              <Field label={dt("reports.designer.type", "Type")}>
                <Select
                  value={p.type}
                  options={[
                    { value: "string", label: dt("reports.designer.text", "Text") },
                    { value: "number", label: dt("reports.designer.number", "Number") },
                    { value: "date", label: dt("reports.designer.date", "Date") },
                    { value: "boolean", label: dt("reports.designer.yes_no", "Yes/No") },
                    { value: "lookup", label: dt("reports.designer.lookup", "Lookup") },
                  ]}
                  onChange={(v) =>
                    setParameter(
                      i,
                      {
                        type: v,
                        defaultValue: null,
                        lookup:
                          v === "lookup"
                            ? (p.lookup ?? {
                                dataSourceId: definition.dataSources[0]?.id ?? "",
                                valueField: "",
                                labelField: null,
                                multiple: false,
                              })
                            : null,
                      },
                      "type",
                    )
                  }
                />
              </Field>
              <Field label={dt("reports.designer.label", "Label")}>
                <TextInput value={p.label ?? ""} onChange={(v) => setParameter(i, { label: v || null }, "label")} />
              </Field>
              <Field label={dt("reports.designer.default", "Default")}>
                <DefaultValueInput parameter={p} onChange={(v) => setParameter(i, { defaultValue: v }, "default")} />
              </Field>
            </div>
            {p.type === "lookup" && (
              <LookupSettings parameter={p} onChange={(lookup, key) => setParameter(i, { lookup, defaultValue: null }, `lookup-${key}`)} />
            )}
          </div>
        ))}
      </Section>

      {editing && (
        <DataSourceEditor
          source={editing}
          allSources={definition.dataSources}
          parameters={definition.parameters}
          timeZone={definition.timeZone}
          onApply={saveSource}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
