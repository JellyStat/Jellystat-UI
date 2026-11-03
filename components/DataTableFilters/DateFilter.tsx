import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Calendar } from "lucide-react";
import FilterItem, { DatesRangeValue } from "./FilterItem";
import { DateRangePicker, Popover, PopoverField, PopoverPanel } from "@/components/ui";
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

  const isEmpty = !query || (query[0] === null && query[1] === null);

  const displayText = () => {
    if (isEmpty) return t("filter.date_range", "Date range");
    const s = query[0] ? formatDateForInput(query[0]) : "...";
    const e = query[1] ? formatDateForInput(query[1]) : "...";
    return `${s} → ${e}`;
  };

  return (
    <Popover className="relative">
      <PopoverField
        icon={<Calendar size={14} />}
        empty={isEmpty}
        onClear={() => setQuery([null, null])}
        clearLabel={t("common.clear", "Clear")}
      >
        {displayText()}
      </PopoverField>
      <PopoverPanel>
        <DateRangePicker
          value={{ from: query[0] ?? undefined, to: query[1] ?? undefined }}
          onChange={(value: DateRange | undefined) => setQuery([value?.from ?? null, value?.to ?? null])}
        />
      </PopoverPanel>
    </Popover>
  );
}
