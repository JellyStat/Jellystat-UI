import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "next-i18next/pages";
import { Calendar, X } from "lucide-react";
import FilterItem, { DatesRangeValue } from "./FilterItem";

interface DateFilterProps {
  keyName: string;
  value: DatesRangeValue;
  onChange: (value: FilterItem | null) => void;
}

// --- UTILS ---
const equalDates = (a: Date | null, b: Date | null) => {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return a.getTime() === b.getTime();
};

const formatDateForInput = (d: Date | null) => {
  if (!d) return "";
  // Ensures we get local YYYY-MM-DD format
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateFromInput = (str: string): Date | null => {
  if (!str) return null;
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export default function DateFilter({ keyName, value, onChange }: DateFilterProps) {
  const { t } = useTranslation("common");

  // Local state matches the DateRangeValue signature
  const [query, setQuery] = useState<DatesRangeValue>(value);
  const [debounced, setDebounced] = useState<DatesRangeValue>(value);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const maxDateStr = formatDateForInput(new Date());

  // --- DEBOUNCE EFFECT ---
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebounced(query);
    }, 200);
    return () => clearTimeout(handler);
  }, [query]);

  // --- FILTER TRIGGER EFFECT ---
  useEffect(() => {
    if (!debounced || !Array.isArray(debounced)) return;

    const [start, end] = debounced;

    // If the debounced value is equal to the current prop value, do nothing
    if (equalDates(start, value[0]) && equalDates(end, value[1])) return;

    // If both are null -> clear the filter
    if (start === null && end === null) {
      onChange(null);
      return;
    }

    // If exactly one is null -> don't trigger change (user hasn't completed range)
    if (start === null || end === null) return;

    onChange(new FilterItem(keyName, debounced));
  }, [debounced, value, keyName, onChange]);

  // Close popover on outside click or Escape
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (containerRef.current.contains(e.target as Node)) return;
      setIsOpen(false);
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // --- HANDLERS ---
  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery([parseDateFromInput(e.target.value), query[1]]);
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery([query[0], parseDateFromInput(e.target.value)]);
  };

  const handleClear = () => {
    setQuery([null, null]);
  };

  const isClearDisabled = query[0] === null && query[1] === null;

  const isEmpty = !query || (query[0] === null && query[1] === null);

  const displayText = () => {
    if (isEmpty) return t("filter.date_range", "Date range");
    const s = query[0] ? formatDateForInput(query[0]) : "...";
    const e = query[1] ? formatDateForInput(query[1]) : "...";
    return `${s} → ${e}`;
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center gap-2 bg-surface/50 border border-transparent hover:border-border rounded py-1.5 px-3 text-xs text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-cyan transition-all shadow-inner"
        aria-expanded={isOpen}
      >
        <div className="text-gray-500">
          <Calendar size={14} />
        </div>
        <div
          className={`flex-1 text-left text-xs tracking-tight font-normal ${isEmpty ? "text-gray-600" : "text-gray-200"}`}
          role="input"
        >
          {displayText()}
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-80 p-4 bg-surface border border-border rounded-b-xl shadow-lg">
          {/* Start Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">
              {t("filter.start_date", "Start Date")}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 group-focus-within:text-brand-cyan transition-colors">
                <Calendar size={16} />
              </div>
              <input
                type="date"
                max={maxDateStr}
                value={formatDateForInput(query[0])}
                onChange={handleStartChange}
                className="w-full bg-surface/50 border border-border rounded-xl py-2 pl-10 pr-3 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-cyan hover:border-gray-500 transition-all shadow-inner [color-scheme:dark]"
              />
            </div>
          </div>

          {/* End Date */}
          <div className="flex flex-col gap-1.5 mt-3">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">
              {t("filter.end_date", "End Date")}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 group-focus-within:text-brand-cyan transition-colors">
                <Calendar size={16} />
              </div>
              <input
                type="date"
                max={maxDateStr}
                min={formatDateForInput(query[0]) || undefined}
                value={formatDateForInput(query[1])}
                onChange={handleEndChange}
                className="w-full bg-surface/50 border border-border rounded-xl py-2 pl-10 pr-3 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-cyan hover:border-gray-500 transition-all shadow-inner [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                handleClear();
                setIsOpen(false);
              }}
              disabled={isClearDisabled}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-all border disabled:opacity-50 disabled:cursor-not-allowed bg-surface/50 border-border text-gray-400 hover:bg-brand-rose/10 hover:text-brand-rose hover:border-brand-rose/30 shadow-inner focus:outline-none focus:ring-2 focus:ring-brand-rose"
            >
              <X size={16} />
              {t("filter.clear", "Clear")}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 py-2 rounded-xl text-sm font-bold bg-brand-cyan text-black hover:brightness-90"
            >
              {t("filter.apply", "Apply")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
