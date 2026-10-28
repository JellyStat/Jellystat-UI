import { ReactNode, useEffect, useState } from "react";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { ChevronDown, Loader2, Check, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";

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
  /** Custom content for an option row. Defaults to `namePredicate(item)`. */
  renderOption?: (item: T, selected: boolean) => ReactNode;
  /** Custom content shown in the closed trigger when a value is set. Defaults to the value's name. */
  valueContent?: ReactNode;
  /** Small heading shown above the options. */
  header?: ReactNode;
  /** Content pinned below the options, e.g. a link to a fuller search. Receives a function that closes the menu. */
  footer?: (close: () => void) => ReactNode;
  /** `missing` draws a dashed rose border to show that nothing is chosen yet. */
  variant?: "default" | "missing";
  disabled?: boolean;
  /** Text shown (with a lock icon) instead of the placeholder while disabled. */
  disabledText?: string;
  /** Options are fetched once per key. Change it to refetch, e.g. when a parent selection changes. */
  cacheKey?: string;
  ariaLabel?: string;
};

export function SelectAsync<T>({
  fetchMethod,
  onSelect,
  idPredicate,
  namePredicate,
  value: initialValue,
  placeholder,
  renderOption,
  valueContent,
  header,
  footer,
  variant = "default",
  disabled = false,
  disabledText,
  cacheKey,
  ariaLabel,
}: Props<T>) {
  const { t } = useTranslation("common");

  const [value, setValue] = useState<string | null>(initialValue?.id ?? null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<T[] | null>(null);

  useEffect(() => {
    setValue(initialValue?.id ?? null);
  }, [initialValue?.id]);

  // Drop cached options when the key changes so the next open fetches fresh ones.
  useEffect(() => {
    setData(null);
  }, [cacheKey]);

  const load = () => {
    if (data !== null || loading) return;
    setLoading(true);
    fetchMethod()
      .then((response) => setData(response))
      .catch((err) => {
        console.error("Failed to fetch async options", err);
        setData([]);
      })
      .finally(() => setLoading(false));
  };

  const handleSelect = (item: T, close: () => void) => {
    setValue(idPredicate(item));
    close();
    onSelect(item);
  };

  const resolvedPlaceholder = placeholder || t("select_async.pick_value", "Pick value");

  let displayText: ReactNode = resolvedPlaceholder;
  let isPlaceholder = true;

  if (value) {
    const foundItem = data?.find((item) => idPredicate(item) === value);
    if (valueContent) {
      displayText = valueContent;
      isPlaceholder = false;
    } else if (foundItem) {
      displayText = namePredicate(foundItem);
      isPlaceholder = false;
    } else if (initialValue) {
      displayText = initialValue.name;
      isPlaceholder = false;
    }
  }

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        aria-label={ariaLabel}
        className="w-full flex items-center gap-2 bg-transparent border border-border rounded-xl py-2.5 px-4 text-sm text-gray-500 cursor-not-allowed"
      >
        <Lock size={14} className="shrink-0" />
        <span className="truncate">{disabledText ?? resolvedPlaceholder}</span>
      </button>
    );
  }

  const borderClass =
    variant === "missing"
      ? "border-dashed border-brand-rose/45 hover:border-brand-rose data-open:border-brand-cyan"
      : "border-border hover:border-gray-500 data-open:border-brand-cyan";

  return (
    <Popover className="relative w-full">
      {({ open, close }) => (
        <>
          <PopoverButton
            type="button"
            aria-label={ariaLabel}
            onClick={() => {
              if (!open) load();
            }}
            className={`w-full flex items-center justify-between bg-surface/80 border rounded-xl py-2.5 pl-4 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan transition-all shadow-inner cursor-pointer ${borderClass}`}
          >
            <span
              className={`min-w-0 flex items-center gap-2 mr-2 text-left ${isPlaceholder ? "text-gray-500" : "text-gray-200 font-medium"}`}
            >
              {typeof displayText === "string" ? <span className="truncate">{displayText}</span> : displayText}
            </span>

            <span className="text-gray-500 shrink-0 pointer-events-none">
              {loading ? (
                <Loader2 size={16} className="animate-spin text-brand-cyan" />
              ) : (
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-300 ${open ? "rotate-180 text-brand-cyan" : ""}`}
                />
              )}
            </span>
          </PopoverButton>

          <PopoverPanel
            anchor={{ to: "bottom start", gap: 8 }}
            className="z-50 w-(--button-width) min-w-64 bg-surface/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl shadow-black/50 focus:outline-none"
          >
            {header && (
              <div className="px-3 pt-3 pb-1 text-[11px] font-bold text-gray-500 uppercase tracking-wider">{header}</div>
            )}
            <div className="p-1 max-h-60 overflow-y-auto custom-scrollbar">
              {loading || data === null ? (
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
                      onClick={() => handleSelect(item, close)}
                      className={`w-full text-left flex items-center justify-between gap-2 px-3 py-2.5 text-sm rounded-lg transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-brand-cyan/10 text-brand-cyan font-bold"
                          : "text-gray-300 hover:bg-surface-hover hover:text-white"
                      }`}
                    >
                      <span className="min-w-0 flex-1 flex items-center gap-2">
                        {renderOption ? renderOption(item, isSelected) : <span className="truncate">{namePredicate(item)}</span>}
                      </span>
                      {isSelected && <Check size={16} className="shrink-0" />}
                    </button>
                  );
                })
              ) : (
                <div className="p-4 text-center text-sm text-gray-500">
                  {t("select_async.no_items", "No matching items found")}
                </div>
              )}
            </div>
            {footer && <div className="border-t border-border p-1">{footer(close)}</div>}
          </PopoverPanel>
        </>
      )}
    </Popover>
  );
}
