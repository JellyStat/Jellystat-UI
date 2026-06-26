import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "next-i18next/pages";
import { Calendar, X } from "lucide-react";
import FilterItem, { DatesRangeValue } from "./FilterItem";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import DateRangePicker from "../Core/DateRangePicker";
import { DateRange } from "react-day-picker";
import { useDebounce } from "@/lib/hooks/useDebounce";

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

export default function DateFilter({ keyName, value, onChange }: DateFilterProps) {
  const { t } = useTranslation("common");

  // Local state matches the DateRangeValue signature
  const [query, setQuery] = useState<DatesRangeValue>(value);
  const debounced = useDebounce(query, 500);

  // --- FILTER TRIGGER EFFECT ---
  useEffect(() => {
    if (!debounced || !Array.isArray(debounced)) return;
    console.log("DateFilter: debounced value changed", debounced);

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
  const handleClear = () => {
    setQuery([null, null]);
  };

  const isEmpty = !query || (query[0] === null && query[1] === null);

  const displayText = () => {
    if (isEmpty) return t("filter.date_range", "Date range");
    const s = query[0] ? formatDateForInput(query[0]) : "...";
    const e = query[1] ? formatDateForInput(query[1]) : "...";
    return `${s} → ${e}`;
  };

  return (
    <div className="relative">
      <Popover className="relative w-full flex items-center min-w-50">
        <PopoverButton className="w-full flex items-center gap-2 bg-surface/50 border border-transparent hover:border-border rounded py-1.5 px-3 text-xs text-gray-200 placeholder:text-gray-600  transition-all shadow-inner">
          <div className="text-gray-500">
            <Calendar size={14} />
          </div>
          <div
            className={`flex-1 text-left text-xs tracking-tight font-normal ${isEmpty ? "text-gray-600" : "text-gray-200"}`}
            role="input"
          >
            {displayText()}
          </div>
        </PopoverButton>
        {!isEmpty && (
          <button
            onClick={handleClear}
            className="absolute right-2 text-gray-500 hover:text-brand-rose transition-colors focus:outline-none"
            title="Clear filter"
          >
            <X size={14} />
          </button>
        )}
        <PopoverPanel anchor="bottom" className="flex flex-col absolute z-50 my-2">
          <DateRangePicker
            value={{ from: query[0] ?? undefined, to: query[1] ?? undefined }}
            onChange={(value: DateRange | undefined) => setQuery([value?.from ?? null, value?.to ?? null])}
          />
        </PopoverPanel>
      </Popover>
    </div>
  );
}
