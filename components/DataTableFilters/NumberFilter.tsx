import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "next-i18next/pages";
import { Hash, X } from "lucide-react";
import FilterItem, { NumberRangeValue } from "./FilterItem";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { useDebounce } from "@/lib/hooks/useDebounce";
import DropdownSelector from "../Core/DropdownSelector";
import NumberField from "../Core/NumberField";

interface NumberFilterProps {
  keyName: string;
  value: number | null | NumberRangeValue;
  onChange: (value: FilterItem | null) => void;
}

enum NumberFilterType {
  SINGLE = "single",
  RANGE = "range",
}

export default function NumberFilter({ keyName, value, onChange }: NumberFilterProps) {
  const { t } = useTranslation("common");

  // Local state matches the DateRangeValue signature
  const [query, setQuery] = useState<number | null | NumberRangeValue>(value);
  const [type, setType] = useState<NumberFilterType>(NumberFilterType.RANGE);
  const debounced = useDebounce(query, 500);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // --- FILTER TRIGGER EFFECT ---
  useEffect(() => {
    if (type === NumberFilterType.SINGLE) {
      if (typeof debounced !== "number") return;

      onChangeRef.current(new FilterItem(keyName, debounced));
      return;
    }

    if (type === NumberFilterType.RANGE) {
      const range = debounced as NumberRangeValue;
      if (range?.min === null || range?.max === null || range?.min === undefined || range?.max === undefined) return;

      onChangeRef.current(new FilterItem(keyName, debounced));
      return;
    }
  }, [debounced, keyName, type]);

  // --- HANDLERS ---
  const handleClear = () => {
    setQuery(null);
    onChange(null);
  };

  const handleSingleChange = (val: number | undefined) => {
    setQuery(val ?? null);
  };

  const handleRangeChange = (val: number | null, minVal: boolean = true) => {
    console.log(`Handling range change: val=${val}, minVal=${minVal}`);
    setQuery((prev) => ({
      min: minVal ? val : (prev as NumberRangeValue)?.min,
      max: minVal ? (prev as NumberRangeValue)?.max : val,
    }));
  };

  const isEmpty =
    !query ||
    (type === NumberFilterType.RANGE && (query as NumberRangeValue)?.min === null && (query as NumberRangeValue)?.max === null) ||
    (type === NumberFilterType.SINGLE && (query as number | null) === null);

  const displayText = () => {
    if (isEmpty && type === NumberFilterType.RANGE) return t("filter.number_range", "Range");
    if (isEmpty && type === NumberFilterType.SINGLE) return t("filter.single_number", "Exact");
    if (type === NumberFilterType.SINGLE) {
      return (query as number | null)?.toString() ?? "...";
    }
    const s =
      (query as NumberRangeValue)?.min !== null && (query as NumberRangeValue)?.min !== undefined
        ? (query as NumberRangeValue)?.min
        : "...";
    const e =
      (query as NumberRangeValue)?.max !== null && (query as NumberRangeValue)?.max !== undefined
        ? (query as NumberRangeValue)?.max
        : "...";
    return `${s} - ${e}`;
  };

  return (
    <div className="relative">
      <Popover className="relative w-full flex items-center min-w-50">
        <PopoverButton className="w-full flex items-center gap-2 bg-surface/50 border border-transparent hover:border-border rounded py-1.5 px-3 text-xs text-gray-200 placeholder:text-gray-600  transition-all shadow-inner">
          <div className="text-gray-500">
            <Hash size={14} />
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
          <div className="p-4 border border-border rounded-lg max-w-sm bg-surface shadow-sm">
            <div>
              {/* Number filter inputs go here */}
              <div className="mb-4 flex flex-row items-center gap-2">
                <div>{t("filter.number_type", "Type")}</div>
                <DropdownSelector
                  data={[{ value: NumberFilterType.SINGLE }, { value: NumberFilterType.RANGE }]}
                  value={type}
                  onChange={(val) => setType(val as NumberFilterType)}
                  labelFn={(val) => {
                    if (val === NumberFilterType.SINGLE) return t("filter.single_number", "Exact");
                    if (val === NumberFilterType.RANGE) return t("filter.number_range", "Range");
                    return "";
                  }}
                />
              </div>
              <div className="">
                {type === NumberFilterType.SINGLE && (
                  <div className="flex flex-col gap-2">
                    <div>{t("filter.value", "Value")}</div>
                    <NumberField
                      value={query as number | undefined}
                      onChange={(val) => handleSingleChange(val)}
                      className="bg-background border border-transparent hover:border-gray-500 focus:border-brand-cyan rounded-lg px-2 py-1.5 text-sm font-bold text-gray-200 text-center focus:outline-none focus:ring-1 focus:ring-brand-cyan"
                    />
                  </div>
                )}
                {type === NumberFilterType.RANGE && (
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-2">
                      <div>{t("filter.min", "Min")}</div>
                      <NumberField
                        value={(query as NumberRangeValue)?.min ?? undefined}
                        onChange={(val) => handleRangeChange(val as number | null, true)}
                        className="bg-background border border-transparent hover:border-gray-500 focus:border-brand-cyan rounded-lg px-2 py-1.5 text-sm font-bold text-gray-200 text-center focus:outline-none focus:ring-1 focus:ring-brand-cyan"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <div>{t("filter.max", "Max")}</div>
                      <NumberField
                        value={(query as NumberRangeValue)?.max ?? undefined}
                        onChange={(val) => handleRangeChange(val as number | null, false)}
                        className="bg-background border border-transparent hover:border-gray-500 focus:border-brand-cyan rounded-lg px-2 py-1.5 text-sm font-bold text-gray-200 text-center focus:outline-none focus:ring-1 focus:ring-brand-cyan"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </PopoverPanel>
      </Popover>
    </div>
  );
}
