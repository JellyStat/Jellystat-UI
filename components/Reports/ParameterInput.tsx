import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from "@headlessui/react";
import clsx from "clsx";
import { Check, ChevronDown, Loader2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import client from "@/lib/api";
import type { ReportDefinition, ReportParameter, ReportParameterOption } from "@/lib/models/reports";

export type ParameterOptionsSource = { reportId: string } | { definition: ReportDefinition };

interface Props {
  parameter: ReportParameter;
  value: unknown;
  onChange: (value: unknown) => void;
  /** Where lookup choices are loaded from: a saved report, or the designer's current definition. */
  source: ParameterOptionsSource;
  /** Current values of the other parameters, which a lookup's data source may filter on. */
  values?: Record<string, unknown>;
  className?: string;
  /** Shown when nothing is chosen (the parameter's default applies, or the filter is switched off). */
  emptyLabel?: string;
}

const inputClass =
  "w-full min-w-0 bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm text-gray-200 outline-none focus:border-brand-purple";

const same = (a: unknown, b: unknown) => String(a) === String(b);

/** Choices of a lookup parameter, reloaded when the definition or the other parameters change. */
function useLookupOptions(parameter: ReportParameter, source: ParameterOptionsSource, values?: Record<string, unknown>) {
  const [options, setOptions] = useState<ReportParameterOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const others = useMemo(() => {
    const rest = { ...(values ?? {}) };
    delete rest[parameter.name];
    return Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== null && v !== undefined && v !== ""));
  }, [values, parameter.name]);
  const key = JSON.stringify([
    parameter.name,
    parameter.lookup,
    "reportId" in source ? source.reportId : { d: source.definition.dataSources, p: source.definition.parameters },
    others,
  ]);

  useEffect(() => {
    if (parameter.type !== "lookup" || !parameter.lookup?.dataSourceId || !parameter.lookup.valueField) {
      setOptions([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        // Pages aren't needed to work out the choices, and may carry large images
        const request =
          "reportId" in source
            ? { reportId: source.reportId }
            : { definition: { ...source.definition, pages: [{ id: "p", name: "p", elements: [] }] } };
        const result = await client.Reports.parameterOptions({ ...request, parameter: parameter.name, parameters: others });
        if (!cancelled) {
          setOptions(result);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message ?? "Failed to load choices");
          setOptions([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { options, loading, error };
}

function LookupInput({ parameter, value, onChange, source, values, className, emptyLabel = "All" }: Props) {
  const { options, loading, error } = useLookupOptions(parameter, source, values);
  const [query, setQuery] = useState("");
  const multiple = !!parameter.lookup?.multiple;
  const selected: unknown[] = Array.isArray(value) ? value : value === null || value === undefined || value === "" ? [] : [value];
  const filtered = query ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())) : options;
  const labelOf = (v: unknown) => options.find((o) => same(o.value, v))?.label ?? String(v);
  const summary = selected.length === 0 ? "" : selected.length <= 2 ? selected.map(labelOf).join(", ") : `${selected.length} selected`;

  return (
    <Combobox
      multiple={multiple}
      value={(multiple ? selected : (selected[0] ?? null)) as any}
      by={(a: unknown, b: unknown) => same(a, b)}
      onChange={(v: unknown) => {
        setQuery("");
        onChange(multiple ? ((v as unknown[]).length ? v : null) : (v ?? null));
      }}
      onClose={() => setQuery("")}
    >
      <div className={clsx("relative min-w-0", className)}>
        <ComboboxInput
          className={clsx(inputClass, "pr-14")}
          placeholder={loading ? "Loading..." : emptyLabel}
          displayValue={() => summary}
          onChange={(ev) => setQuery(ev.target.value)}
          onKeyDown={(ev) => ev.stopPropagation()}
        />
        <div className="absolute inset-y-0 right-1 flex items-center gap-0.5">
          {loading && <Loader2 size={12} className="animate-spin text-gray-500" />}
          {selected.length > 0 && (
            <button type="button" title="Clear" className="p-0.5 text-gray-500 hover:text-white cursor-pointer" onClick={() => onChange(null)}>
              <X size={12} />
            </button>
          )}
          <ComboboxButton className="p-0.5 text-gray-500 hover:text-white cursor-pointer">
            <ChevronDown size={14} />
          </ComboboxButton>
        </div>
      </div>
      <ComboboxOptions
        anchor="bottom start"
        className="z-[70] w-(--input-width) min-w-48 max-h-64 overflow-y-auto rounded-lg border border-border bg-surface py-1 shadow-2xl shadow-black/60 empty:invisible [--anchor-gap:4px]"
      >
        {error && <div className="px-3 py-2 text-xs text-brand-rose">{error}</div>}
        {!error && !loading && filtered.length === 0 && <div className="px-3 py-2 text-xs text-gray-500">No matches</div>}
        {filtered.map((o) => (
          <ComboboxOption
            key={String(o.value)}
            value={o.value}
            className="group flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 cursor-pointer data-focus:bg-surface-hover data-focus:text-white"
          >
            <Check size={13} className="invisible text-brand-purple shrink-0 group-data-selected:visible" />
            <span className="truncate">{o.label}</span>
          </ComboboxOption>
        ))}
      </ComboboxOptions>
    </Combobox>
  );
}

/** Input for one report parameter: text, number, date, yes/no, or a dropdown of values from a data source (lookup). */
export default function ParameterInput(props: Props) {
  const { parameter: p, value, onChange, className, emptyLabel = "Default" } = props;
  if (p.type === "lookup") {
    return <LookupInput {...props} />;
  }
  if (p.type === "boolean") {
    return (
      <select
        className={clsx(inputClass, "cursor-pointer", className)}
        value={value === true ? "true" : value === false ? "false" : ""}
        onKeyDown={(ev) => ev.stopPropagation()}
        onChange={(ev) => onChange(ev.target.value === "" ? null : ev.target.value === "true")}
      >
        <option value="">{emptyLabel}</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    );
  }
  return (
    <input
      className={clsx(inputClass, className)}
      type={p.type === "number" ? "number" : p.type === "date" ? "date" : "text"}
      placeholder={emptyLabel}
      value={value === null || value === undefined ? "" : String(value)}
      onKeyDown={(ev) => ev.stopPropagation()}
      onChange={(ev) => onChange(ev.target.value === "" ? null : p.type === "number" ? Number(ev.target.value) : ev.target.value)}
    />
  );
}
