import { Calendar, ChevronDownIcon, Loader2, LucideIcon, X } from "lucide-react";
import { Fragment, useRef, useState, useEffect } from "react";
import {
  Button,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react";
import { DateRange } from "react-day-picker";
import DateRangePicker from "./DateRangePicker";
import { useTranslation } from "react-i18next";

interface Props {
  value: DateRange | undefined;
  onChange: (value: DateRange | undefined) => void;
  disabled?: boolean;
  loading?: boolean;
}

export default function DateRangePickerButton({ value, onChange, disabled = false, loading = false }: Props) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [buttonWidth, setButtonWidth] = useState<number | undefined>(undefined);
  const { t } = useTranslation("common");

  useEffect(() => {
    function updateWidth() {
      const w = (buttonRef.current?.offsetWidth ?? 0) - 4;
      if (w && w > 0) setButtonWidth(w);
    }
    updateWidth();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && buttonRef.current) {
      ro = new ResizeObserver(updateWidth);
      ro.observe(buttonRef.current);
    }
    window.addEventListener("resize", updateWidth);
    return () => {
      window.removeEventListener("resize", updateWidth);
      if (ro) ro.disconnect();
    };
  }, []);

  const handleClear = () => {
    onChange(undefined);
  };

  // const getDefaultStartDate = () => {
  //   const now = new Date();
  //   now.setHours(23, 59, 59, 999);
  //   const start = new Date(now);
  //   start.setDate(now.getDate() - 31);
  //   return start;
  // };

  // const getDefaultEndDate = () => {
  //   const now = new Date();
  //   now.setHours(23, 59, 59, 999);
  //   return now;
  // };

  const formatDateForInput = (d: Date | null) => {
    if (!d) return "";
    // Ensures we get local YYYY-MM-DD format
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const displayText = () => {
    if (isEmpty) return t("filter.date_range", "Date range");
    const s = value?.from ? formatDateForInput(value.from) : "...";
    const e = value?.to ? formatDateForInput(value.to) : "...";
    return `${s} → ${e}`;
  };

  const isEmpty = !value || (value.from === null && value.to === null);

  return (
    <div className="relative min-w-[200px]">
      <div className="relative">
        <Popover className="relative w-full flex items-center min-w-50">
          <PopoverButton
            className={`w-full bg-surface/80 backdrop-blur-md border border-border focus:outline-none hover:border-gray-500 rounded-xl py-2.5 pl-10 pr-8 text-sm font-bold text-gray-200 appearance-none transition-all cursor-pointer shadow-sm flex items-center`}
          >
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
              <Calendar size={14} />
            </div>
            <div className={`min-w-0 flex-1 overflow-hidden text-left text-ellipsis whitespace-nowrap`} role="input">
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
              value={{ from: value?.from ?? undefined, to: value?.to ?? undefined }}
              onChange={(value: DateRange | undefined) =>
                onChange({ from: value?.from ?? undefined, to: value?.to ?? undefined })
              }
            />
          </PopoverPanel>
        </Popover>
      </div>
    </div>
  );
}
