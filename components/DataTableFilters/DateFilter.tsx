import React, { useEffect, useState } from "react";
import { useTranslation } from "next-i18next/pages";
import { Calendar, X } from "lucide-react";
import FilterItem from "./FilterItem";

export type DatesRangeValue = [Date | null, Date | null];

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

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
      
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
            max={maxDateStr} // Prevent future dates
            value={formatDateForInput(query[0])}
            onChange={handleStartChange}
            className="w-full bg-surface/50 border border-border rounded-xl py-2 pl-10 pr-3 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-cyan hover:border-gray-500 transition-all shadow-inner [color-scheme:dark]"
          />
        </div>
      </div>

      {/* End Date */}
      <div className="flex flex-col gap-1.5">
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
            min={formatDateForInput(query[0]) || undefined} // End date can't be before start date
            value={formatDateForInput(query[1])}
            onChange={handleEndChange}
            className="w-full bg-surface/50 border border-border rounded-xl py-2 pl-10 pr-3 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-cyan hover:border-gray-500 transition-all shadow-inner [color-scheme:dark]"
          />
        </div>
      </div>

      {/* Clear Button */}
      <button
        onClick={handleClear}
        disabled={isClearDisabled}
        className="mt-1 flex items-center justify-center gap-2 w-full py-2 rounded-xl text-sm font-bold transition-all border disabled:opacity-50 disabled:cursor-not-allowed
          bg-surface/50 border-border text-gray-400 hover:bg-brand-rose/10 hover:text-brand-rose hover:border-brand-rose/30 shadow-inner focus:outline-none focus:ring-2 focus:ring-brand-rose"
      >
        <X size={16} />
        {t("filter.clear", "Clear")}
      </button>

    </div>
  );
}