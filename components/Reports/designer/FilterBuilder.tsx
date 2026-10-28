import clsx from "clsx";
import { FolderPlus, Plus, Trash2 } from "lucide-react";
import type { ReportFieldInfo, ReportFilterNode, ReportParameter } from "@/lib/models/reports";
import { inputClass, NumberInput, Select, TextInput } from "./controls";

export const OPERATOR_LABELS: Record<string, string> = {
  eq: "equals",
  neq: "does not equal",
  gt: "greater than",
  gte: "at least",
  lt: "less than",
  lte: "at most",
  contains: "contains",
  notContains: "does not contain",
  startsWith: "starts with",
  endsWith: "ends with",
  isNull: "is empty",
  isNotNull: "is not empty",
  in: "is one of",
  notIn: "is none of",
  between: "between",
  lastNDays: "in the last N days",
  lastNHours: "in the last N hours",
  today: "is today",
  thisMonth: "is this month",
  thisYear: "is this year",
};

const NO_VALUE = new Set(["isNull", "isNotNull", "today", "thisMonth", "thisYear"]);

export function operatorsFor(field?: ReportFieldInfo): string[] {
  const nullOps = field?.nullable ? ["isNull", "isNotNull"] : [];
  switch (field?.type) {
    case "string":
      return ["eq", "neq", "contains", "notContains", "startsWith", "endsWith", "in", "notIn", ...nullOps];
    case "boolean":
      return ["eq", "neq", ...nullOps];
    case "enum":
      return ["eq", "neq", "in", "notIn", ...nullOps];
    case "date":
      return ["lastNDays", "lastNHours", "today", "thisMonth", "thisYear", "between", "gte", "gt", "lte", "lt", ...nullOps];
    default:
      return ["eq", "neq", "gt", "gte", "lt", "lte", "between", "in", "notIn", ...nullOps];
  }
}

interface Props {
  node: ReportFilterNode;
  fields: ReportFieldInfo[];
  parameters: ReportParameter[];
  onChange: (node: ReportFilterNode) => void;
  onRemove?: () => void;
  depth?: number;
}

function ValueInput({
  field,
  operator,
  value,
  onChange,
}: {
  field?: ReportFieldInfo;
  operator: string;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  if (operator === "lastNDays" || operator === "lastNHours") {
    return <NumberInput value={typeof value === "number" ? value : Number(value) || null} min={0} onChange={(v) => onChange(v)} />;
  }
  if (operator === "in" || operator === "notIn") {
    const text = Array.isArray(value) ? value.join(", ") : String(value ?? "");
    return (
      <TextInput
        value={text}
        placeholder={field?.options ? field.options.slice(0, 3).join(", ") : "a, b, c"}
        onChange={(v) =>
          onChange(
            v
              .split(",")
              .map((x) => x.trim())
              .filter((x) => x !== ""),
          )
        }
      />
    );
  }
  switch (field?.type) {
    case "boolean":
      return (
        <Select
          value={value === true ? "true" : value === false ? "false" : ""}
          placeholder="Choose..."
          options={[
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ]}
          onChange={(v) => onChange(v === "true")}
        />
      );
    case "enum":
      return (
        <Select
          value={String(value ?? "")}
          placeholder="Choose..."
          options={(field.options ?? []).map((o) => ({ value: o, label: o }))}
          onChange={onChange}
        />
      );
    case "date":
      return (
        <input
          type="date"
          className={inputClass}
          value={typeof value === "string" ? value.slice(0, 10) : ""}
          onKeyDown={(ev) => ev.stopPropagation()}
          onChange={(ev) => onChange(ev.target.value || null)}
        />
      );
    case "number":
    case "integer":
    case "duration":
    case "bytes":
      return (
        <NumberInput
          value={typeof value === "number" ? value : value === null || value === undefined || value === "" ? null : Number(value)}
          onChange={onChange}
        />
      );
    default:
      return <TextInput value={String(value ?? "")} onChange={onChange} />;
  }
}

/** Nested AND/OR groups of rules. Rules can take their value from a report parameter instead of a fixed value. */
export default function FilterBuilder({ node, fields, parameters, onChange, onRemove, depth = 0 }: Props) {
  const rules = node.rules ?? [];
  const setRule = (i: number, rule: ReportFilterNode) => onChange({ ...node, rules: rules.map((r, j) => (j === i ? rule : r)) });
  const removeRule = (i: number) => onChange({ ...node, rules: rules.filter((_, j) => j !== i) });
  const firstField = fields[0];

  return (
    <div
      className={clsx(
        "rounded-lg border p-2 space-y-2",
        depth % 2 === 0 ? "border-border bg-background/40" : "border-brand-purple/30 bg-brand-purple/5",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-md border border-border overflow-hidden text-[11px] font-bold">
          {(["and", "or"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange({ ...node, combinator: c })}
              className={clsx(
                "px-2 py-0.5 cursor-pointer uppercase",
                (node.combinator ?? "and") === c ? "bg-brand-purple text-white" : "text-gray-400 hover:text-white",
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1 text-[11px] text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            className="accent-brand-purple"
            checked={!!node.not}
            onChange={(ev) => onChange({ ...node, not: ev.target.checked })}
          />
          NOT
        </label>
        <div className="flex-1" />
        <button
          type="button"
          className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white cursor-pointer"
          onClick={() =>
            onChange({
              ...node,
              rules: [...rules, { field: firstField?.key, operator: operatorsFor(firstField)[0], value: null }],
            })
          }
        >
          <Plus size={12} /> Rule
        </button>
        <button
          type="button"
          className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white cursor-pointer"
          onClick={() => onChange({ ...node, rules: [...rules, { combinator: "and", rules: [] }] })}
        >
          <FolderPlus size={12} /> Group
        </button>
        {onRemove && (
          <button type="button" title="Remove group" className="p-0.5 text-gray-500 hover:text-brand-rose cursor-pointer" onClick={onRemove}>
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {rules.length === 0 && <p className="text-[11px] text-gray-500 px-1">No conditions: every row is included.</p>}

      {rules.map((rule, i) =>
        rule.rules ? (
          <FilterBuilder
            key={i}
            node={rule}
            fields={fields}
            parameters={parameters}
            depth={depth + 1}
            onChange={(r) => setRule(i, r)}
            onRemove={() => removeRule(i)}
          />
        ) : (
          <div key={i} className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.4fr)_auto] gap-1.5 items-center">
            <Select
              value={rule.field ?? ""}
              options={fields.map((f) => ({ value: f.key, label: f.label }))}
              onChange={(key) => {
                const f = fields.find((x) => x.key === key);
                const ops = operatorsFor(f);
                setRule(i, {
                  ...rule,
                  field: key,
                  operator: ops.includes(rule.operator ?? "") ? rule.operator : ops[0],
                  value: null,
                  valueTo: null,
                });
              }}
            />
            <Select
              value={rule.operator ?? "eq"}
              options={operatorsFor(fields.find((f) => f.key === rule.field)).map((o) => ({
                value: o,
                label: OPERATOR_LABELS[o] ?? o,
              }))}
              onChange={(op) => setRule(i, { ...rule, operator: op })}
            />
            <div className="flex gap-1 min-w-0">
              {!NO_VALUE.has(rule.operator ?? "") && (
                <>
                  {parameters.length > 0 && (
                    <select
                      title="Take the value from a report parameter"
                      className={clsx(inputClass, "w-auto! shrink-0 cursor-pointer")}
                      value={rule.parameter ?? ""}
                      onKeyDown={(ev) => ev.stopPropagation()}
                      onChange={(ev) => setRule(i, { ...rule, parameter: ev.target.value || null })}
                    >
                      <option value="">Value</option>
                      {parameters.map((p) => (
                        <option key={p.name} value={p.name}>
                          @{p.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {!rule.parameter && (
                    <div className="flex gap-1 flex-1 min-w-0">
                      <ValueInput
                        field={fields.find((f) => f.key === rule.field)}
                        operator={rule.operator ?? "eq"}
                        value={rule.value}
                        onChange={(v) => setRule(i, { ...rule, value: v })}
                      />
                      {rule.operator === "between" && (
                        <ValueInput
                          field={fields.find((f) => f.key === rule.field)}
                          operator="eq"
                          value={rule.valueTo}
                          onChange={(v) => setRule(i, { ...rule, valueTo: v })}
                        />
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            <button
              type="button"
              title="Remove rule"
              className="p-1 text-gray-500 hover:text-brand-rose cursor-pointer"
              onClick={() => removeRule(i)}
            >
              <Trash2 size={12} />
            </button>
          </div>
        ),
      )}
    </div>
  );
}
