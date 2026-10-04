import { ChevronDownIcon, Loader2, LucideIcon } from "lucide-react";
import { Fragment, useRef, useState, useEffect } from "react";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from "@headlessui/react";

export type Props<T> = {
  data: DropdownOption<T>[];
  value?: T | undefined;
  labelFn: (value: T) => string;
  onChange?: (value: T) => void;
  disabled?: boolean;
  placeholder?: string;
  leftIcon?: LucideIcon;
  loading?: boolean;
  emptyDataMessage?: string;
  widthPx?: number;
};

export type DropdownOption<T> = {
  value: T;
  Icon?: LucideIcon;
};

export default function DropdownSelector<T>({
  data,
  value,
  onChange,
  disabled,
  labelFn,
  placeholder,
  leftIcon,
  loading = false,
  emptyDataMessage = "No options available",
  widthPx = 200,
}: Props<T>) {
  const selectedOption: DropdownOption<T> | undefined = value !== undefined ? data.find((d) => d.value === value) : undefined;
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [buttonWidth, setButtonWidth] = useState<number | undefined>(undefined);

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

  const hasLeftIcon = loading == true || (selectedOption?.Icon ?? leftIcon) != null;

  return (
    <div className="relative" style={{ minWidth: `${widthPx}px` }}>
      <Listbox
        value={(selectedOption ?? null) as DropdownOption<T>}
        onChange={(opt: DropdownOption<T>) => onChange?.(opt.value)}
        disabled={disabled}
      >
        <div className="relative">
          <ListboxButton
            ref={buttonRef as any}
            className={`w-full bg-surface/80 backdrop-blur-md border border-border focus:outline-none hover:border-gray-500 rounded-xl py-2.5 ${hasLeftIcon ? "pl-10" : "pl-4"} pr-8 text-sm font-bold text-gray-200 appearance-none transition-all cursor-pointer shadow-sm flex items-center`}
          >
            {hasLeftIcon && (
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                {(() => {
                  if (loading) return <Loader2 size={16} className="animate-spin" />;
                  const Icon = selectedOption?.Icon ?? leftIcon;
                  return Icon ? <Icon size={16} /> : null;
                })()}
              </div>
            )}
            <span
              className={`min-w-0 flex-1 overflow-hidden text-left text-ellipsis whitespace-nowrap ${selectedOption ? "" : "text-gray-500 font-normal"}`}
            >
              {selectedOption ? labelFn(selectedOption.value) : (placeholder ?? "Select")}
            </span>
            <ChevronDownIcon
              className="group pointer-events-none absolute top-3 right-2.5 size-4 text-gray-500"
              aria-hidden="true"
            />
          </ListboxButton>

          <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
            <ListboxOptions
              anchor="bottom start"
              className="[--anchor-gap:8px] [--anchor-padding:16px] focus:outline-none absolute mx-0.5 bg-surface border border-border rounded-lg shadow-lg max-h-60 overflow-auto z-50 py-1"
              style={buttonWidth ? { width: `${buttonWidth}px` } : undefined}
            >
              {(loading != null ? loading == true : true) && data.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-400">{emptyDataMessage}</div>
              )}
              {data.map((item, idx) => (
                <ListboxOption
                  key={idx}
                  value={item}
                  className="cursor-pointer select-none relative py-2 px-3 m-2 rounded-lg flex items-center gap-2 text-sm text-gray-200 hover:bg-brand-purple/40 "
                >
                  {item.Icon ? <item.Icon size={16} /> : null}
                  <span>{labelFn(item.value)}</span>
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}
