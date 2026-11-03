import { useEffect, useState } from "react";
import FilterItem from "./FilterItem";
import { Check, X, Minus } from "lucide-react";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { cn, focusRing } from "@/components/ui";

export default function BooleanFilter({
  keyName,
  label,
  value,
  isInverted = false,
  onChange,
}: {
  keyName: string;
  label: string;
  value: boolean | null;
  isInverted?: boolean;
  onChange: (value: FilterItem | null) => void;
}) {
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

  function cycleValue() {
    setQuery((prev) => {
      switch (prev) {
        case null:
          return true;
        case true:
          return false;
        case false:
          return null;
        default:
          return null;
      }
    });
  }

  // Tri-state: any (null) -> yes (true) -> no (false)
  const stateStyles = {
    null: "bg-background border-border text-gray-500",
    true: "bg-success border-success text-black",
    false: "bg-danger border-danger text-white",
  };

  const currentState = query === null ? "null" : query ? "true" : "false";

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
      <button
        type="button"
        onClick={cycleValue}
        aria-label={label}
        aria-pressed={query === null ? "mixed" : query}
        className={cn(
          "size-6 flex items-center justify-center rounded-lg border transition-all shadow-inner cursor-pointer",
          stateStyles[currentState as keyof typeof stateStyles],
          focusRing,
        )}
      >
        {query === null && <Minus size={14} />}
        {query === true && <Check size={14} strokeWidth={3} />}
        {query === false && <X size={14} strokeWidth={3} />}
      </button>
    </div>
  );
}
