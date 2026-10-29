import clsx from "clsx";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { ReportCapabilities, ReportDataResult } from "@/lib/models/reports";

export const CapabilitiesContext = createContext<ReportCapabilities | null>(null);
export const useCapabilities = () => useContext(CapabilitiesContext);

/** The designer's latest preview results by data source id, for binding to columns only known after running (pivots). */
export const PreviewDataContext = createContext<Record<string, ReportDataResult>>({});

export const inputClass =
  "w-full min-w-0 bg-background border border-border rounded-md px-2 py-1 text-xs text-gray-200 outline-none focus:border-brand-purple transition-colors disabled:opacity-50";

export function Field({ label, children, className, hint }: { label: string; children: ReactNode; className?: string; hint?: string }) {
  return (
    <label className={clsx("flex flex-col gap-1 min-w-0", className)} title={hint}>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{label}</span>
      {children}
    </label>
  );
}

export function Section({
  title,
  children,
  defaultOpen = true,
  actions,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  actions?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border/60">
      <div className="flex items-center justify-between px-3 py-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 text-xs font-bold text-gray-300 hover:text-white cursor-pointer"
        >
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          {title}
        </button>
        {actions}
      </div>
      {open && <div className="px-3 pb-3 space-y-2.5">{children}</div>}
    </div>
  );
}

/** Text input that commits on every keystroke but keeps its own state, so the cursor never jumps. */
export function TextInput({
  value,
  onChange,
  placeholder,
  multiline,
  rows = 3,
  disabled,
  className,
}: {
  value: string | null | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
  className?: string;
}) {
  const [text, setText] = useState(value ?? "");
  useEffect(() => setText(value ?? ""), [value]);
  const props = {
    value: text,
    placeholder,
    disabled,
    className: clsx(inputClass, className),
    onChange: (ev: { target: { value: string } }) => {
      setText(ev.target.value);
      onChange(ev.target.value);
    },
    onKeyDown: (ev: React.KeyboardEvent) => ev.stopPropagation(),
  };
  return multiline ? <textarea rows={rows} {...props} className={clsx(props.className, "resize-y font-mono")} /> : <input type="text" {...props} />;
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled,
  placeholder,
}: {
  value: number | null | undefined;
  onChange: (v: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [text, setText] = useState(value === null || value === undefined ? "" : String(Math.round(value * 100) / 100));
  useEffect(() => setText(value === null || value === undefined ? "" : String(Math.round(value * 100) / 100)), [value]);
  return (
    <input
      type="number"
      className={inputClass}
      value={text}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      placeholder={placeholder}
      onKeyDown={(ev) => ev.stopPropagation()}
      onChange={(ev) => {
        setText(ev.target.value);
        if (ev.target.value === "") {
          onChange(null);
          return;
        }
        const n = Number(ev.target.value);
        if (Number.isFinite(n)) {
          onChange(Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min ?? Number.NEGATIVE_INFINITY, n)));
        }
      }}
    />
  );
}

export function Select<T extends string>({
  value,
  onChange,
  options,
  disabled,
  placeholder,
}: {
  value: T | null | undefined;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <select
      className={clsx(inputClass, "cursor-pointer")}
      value={value ?? ""}
      disabled={disabled}
      onChange={(ev) => onChange(ev.target.value as T)}
      onKeyDown={(ev) => ev.stopPropagation()}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function ColorInput({
  value,
  onChange,
  allowNone,
}: {
  value: string | null | undefined;
  onChange: (v: string | null) => void;
  allowNone?: boolean;
}) {
  const hex = value && /^#[0-9a-f]{6}$/i.test(value) ? value : "#000000";
  return (
    <div className="flex items-center gap-1 min-w-0">
      <input
        type="color"
        value={hex}
        onChange={(ev) => onChange(ev.target.value)}
        className="w-7 h-7 shrink-0 rounded border border-border bg-transparent cursor-pointer p-0.5"
        style={{ opacity: value ? 1 : 0.35 }}
      />
      <TextInput value={value ?? ""} onChange={(v) => onChange(v.trim() === "" ? null : v.trim())} placeholder={allowNone ? "none" : "#000000"} />
      {allowNone && value && (
        <button type="button" onClick={() => onChange(null)} className="p-1 text-gray-500 hover:text-white cursor-pointer" title="None">
          <X size={12} />
        </button>
      )}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer select-none">
      <input type="checkbox" checked={checked} onChange={(ev) => onChange(ev.target.checked)} className="accent-brand-purple cursor-pointer" />
      {label}
    </label>
  );
}

export function ToolButton({
  title,
  onClick,
  children,
  active,
  disabled,
  className,
}: {
  title: string;
  onClick: () => void;
  children: ReactNode;
  active?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "p-1.5 rounded-md transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default",
        active ? "bg-brand-purple/20 text-brand-purple" : "text-gray-400 hover:text-white hover:bg-surface-hover",
        className,
      )}
    >
      {children}
    </button>
  );
}
