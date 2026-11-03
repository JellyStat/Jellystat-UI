import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import FilterItem from "./FilterItem";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { cn } from "@/components/ui";

// All / yes / no as three named buttons, so the current state reads without knowing what a
// tick, cross or dash means.
export default function BooleanFilter({
  keyName,
  label,
  value,
  isInverted = false,
  trueLabel,
  falseLabel,
  onChange,
}: {
  keyName: string;
  // Accessible name for the group, e.g. "Transcode".
  label: string;
  value: boolean | null;
  isInverted?: boolean;
  trueLabel?: string;
  falseLabel?: string;
  onChange: (value: FilterItem | null) => void;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState<boolean | null>(isInverted == true ? (value != null ? value == false : value) : value);

  const debounced = useDebounce(query, 100);

  useEffect(() => {
    const filterValue = debounced == null ? null : isInverted == true ? debounced == false : debounced;
    if (filterValue === value) return;

    if (filterValue == null) {
      onChange(null);
    } else {
      onChange(new FilterItem(keyName, filterValue));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const options: { value: boolean | null; label: string; active: string }[] = [
    { value: null, label: t("common.all", "All"), active: "bg-surface-hover text-white" },
    { value: true, label: trueLabel ?? t("common.yes", "Yes"), active: "bg-success/15 text-success" },
    { value: false, label: falseLabel ?? t("common.no", "No"), active: "bg-danger/15 text-danger" },
  ];

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex items-center p-0.5 bg-background border border-border rounded-lg"
    >
      {options.map((option) => {
        const isActive = query === option.value;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => setQuery(option.value)}
            className={cn(
              "px-2 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
              isActive ? option.active : "text-gray-500 hover:text-gray-200"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
