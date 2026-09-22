import { useEffect, useState } from "react";
import FilterItem from "./FilterItem";
import { Check, X, Minus } from "lucide-react";
import { useDebounce } from "@/lib/hooks/useDebounce";

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

  const stateStyles = {
    null: "bg-surface border-border text-gray-500",
    true: "bg-brand-emerald border-brand-emerald text-black",
    false: "bg-brand-rose border-brand-rose text-white",
  };

  const currentState = query === null ? "null" : query ? "true" : "false";

  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
      <button
        onClick={cycleValue}
        className={`w-6 h-6 flex items-center justify-center rounded border transition-all duration-300 shadow-inner ${stateStyles[currentState as keyof typeof stateStyles]}`}
      >
        {query === null && <Minus size={14} />}
        {query === true && <Check size={14} strokeWidth={3} />}
        {query === false && <X size={14} strokeWidth={3} />}
      </button>
    </div>
  );
}
