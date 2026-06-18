import { useState, useRef, useEffect } from "react";
import { ChevronDown, Loader2, Check } from "lucide-react";
import { useTranslation } from "next-i18next/pages";

export class DefaultSelectedItem {
  id: string;
  name: string;

  public constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
}

type Props<T> = {
  fetchMethod: () => Promise<T[]>;
  onSelect: (value: T | null) => void;
  idPredicate: (item: T) => string;
  namePredicate: (item: T) => string;
  value?: DefaultSelectedItem | null;
  placeholder?: string;
};

export function SelectAsync<T>({
  fetchMethod,
  onSelect,
  idPredicate,
  namePredicate,
  value: initialValue,
  placeholder,
}: Props<T>) {
  const { t } = useTranslation("common");

  const [value, setValue] = useState<string | null>(initialValue?.id ?? null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<T[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);

    if (nextState && data.length === 0 && !loading) {
      setLoading(true);
      fetchMethod()
        .then((response) => {
          setData(response);
        })
        .catch((err) => {
          console.error("Failed to fetch async options", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  const handleSelect = (item: T) => {
    const id = idPredicate(item);
    setValue(id);
    setIsOpen(false);
    onSelect(item);
  };

  const resolvedPlaceholder = placeholder || t("select_async.pick_value", "Pick value");

  let displayText = resolvedPlaceholder;
  let isPlaceholder = true;

  if (value) {
    const foundItem = data.find((item) => idPredicate(item) === value);
    if (foundItem) {
      displayText = namePredicate(foundItem);
      isPlaceholder = false;
    } else if (initialValue) {
      displayText = initialValue.name;
      isPlaceholder = false;
    }
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        className={`w-full flex items-center justify-between bg-surface/80 border rounded-xl py-2.5 pl-4 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan transition-all shadow-inner ${
          isOpen ? "border-brand-cyan" : "border-border hover:border-gray-500"
        }`}
      >
        <span className={`truncate mr-2 ${isPlaceholder ? "text-gray-500" : "text-gray-200 font-medium"}`}>{displayText}</span>

        <span className="text-gray-500 shrink-0 pointer-events-none">
          {loading ? (
            <Loader2 size={16} className="animate-spin text-brand-cyan" />
          ) : (
            <ChevronDown
              size={16}
              className={`transition-transform duration-300 ${isOpen ? "rotate-180 text-brand-cyan" : ""}`}
            />
          )}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-surface/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl shadow-black/50 max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-1">
            {loading ? (
              <div className="p-4 flex items-center justify-center text-sm text-gray-400 font-medium">
                <Loader2 size={16} className="animate-spin mr-2 text-brand-cyan" />
                {t("common.loading", "Loading")}
              </div>
            ) : data.length > 0 ? (
              data.map((item) => {
                const id = idPredicate(item);
                const isSelected = value === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={`w-full text-left flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-colors group ${
                      isSelected
                        ? "bg-brand-cyan/10 text-brand-cyan font-bold"
                        : "text-gray-300 hover:bg-surface-hover hover:text-white"
                    }`}
                  >
                    <span className="truncate">{namePredicate(item)}</span>
                    {isSelected && <Check size={16} className="shrink-0 ml-2" />}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">{t("select_async.no_items", "No matching items found")}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
