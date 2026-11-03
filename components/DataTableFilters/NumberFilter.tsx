import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Hash } from "lucide-react";
import FilterItem, { NumberFilterType, NumberRangeValue } from "./FilterItem";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { inputClass, Label, NumberField, Popover, PopoverField, PopoverPanel, Select } from "@/components/ui";

interface NumberFilterProps {
  keyName: string;
  value: number | null | NumberRangeValue;
  filterType?: NumberFilterType;
  onChange: (value: FilterItem | null) => void;
}

const numberInputClass = inputClass({ size: "sm" }, "text-center font-bold");

export default function NumberFilter({ keyName, value, filterType, onChange }: NumberFilterProps) {
  const { t } = useTranslation("common");

  // Local state matches the DateRangeValue signature
  const [query, setQuery] = useState<number | null | NumberRangeValue>(value);
  const [type, setType] = useState<NumberFilterType>(filterType ?? NumberFilterType.RANGE);
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
    <Popover className="relative">
      <PopoverField icon={<Hash size={14} />} empty={isEmpty} onClear={handleClear} clearLabel={t("common.clear", "Clear")}>
        {displayText()}
      </PopoverField>
      <PopoverPanel>
        <div className="p-4 w-64 space-y-4 border border-border rounded-xl bg-surface shadow-2xl shadow-black/40">
          {!filterType && (
            <div className="space-y-1.5">
              <Label>{t("filter.number_type", "Type")}</Label>
              <Select
                data={[{ value: NumberFilterType.SINGLE }, { value: NumberFilterType.RANGE }]}
                value={type}
                onChange={(val) => setType(val as NumberFilterType)}
                labelFn={(val) => {
                  if (val === NumberFilterType.SINGLE) return t("filter.single_number", "Exact");
                  if (val === NumberFilterType.RANGE) return t("filter.number_range", "Range");
                  return "";
                }}
                widthPx={0}
                className="w-full"
              />
            </div>
          )}
          {type === NumberFilterType.SINGLE && (
            <div className="space-y-1.5">
              <Label>{t("common.value", "Value")}</Label>
              <NumberField
                value={query as number | undefined}
                onChange={(val) => handleSingleChange(val)}
                className={numberInputClass}
              />
            </div>
          )}
          {type === NumberFilterType.RANGE && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("common.min", "Min")}</Label>
                <NumberField
                  value={(query as NumberRangeValue)?.min ?? undefined}
                  onChange={(val) => handleRangeChange(val as number | null, true)}
                  className={numberInputClass}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("common.max", "Max")}</Label>
                <NumberField
                  value={(query as NumberRangeValue)?.max ?? undefined}
                  onChange={(val) => handleRangeChange(val as number | null, false)}
                  className={numberInputClass}
                />
              </div>
            </div>
          )}
        </div>
      </PopoverPanel>
    </Popover>
  );
}
