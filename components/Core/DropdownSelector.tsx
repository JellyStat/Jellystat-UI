import { ChevronDownIcon, LucideIcon } from "lucide-react";
import { Fragment, useRef, useState, useEffect } from "react";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from "@headlessui/react";

export type Props<T> = {
  data: DropdownOption<T>[];
  value?: T | undefined;
  labelFn: (value: T) => string;
  onChange?: (value: T) => void;
  disabled?: boolean;
};

export type DropdownOption<T> = {
  value: T;
  Icon?: LucideIcon;
};

export default function DropdownSelector<T>({ data, value, onChange, disabled, labelFn }: Props<T>) {
  const selectedOption: DropdownOption<T> | undefined = value !== undefined ? data.find((d) => d.value === value) : undefined;
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [buttonWidth, setButtonWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    function updateWidth() {
      const w = buttonRef.current?.offsetWidth;
      if (w) setButtonWidth(w);
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

  return (
    <div className="relative min-w-[200px]">
      <Listbox value={selectedOption} onChange={(opt: DropdownOption<T>) => onChange?.(opt.value)} disabled={disabled}>
        <div className="relative">
          <ListboxButton
            ref={buttonRef as any}
            className="w-full bg-surface/80 backdrop-blur-md border border-border hover:border-gray-500 rounded-xl py-2.5 pl-10 pr-8 text-sm font-bold text-gray-200 appearance-none transition-all cursor-pointer shadow-sm flex items-center"
          >
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
              {(() => {
                const Icon = selectedOption?.Icon;
                return Icon ? <Icon size={16} /> : null;
              })()}
            </div>
            <span className="flex-1 text-left">{selectedOption ? labelFn(selectedOption.value) : "Select"}</span>
            <ChevronDownIcon
              className="group pointer-events-none absolute top-3.5 right-2.5 size-4 fill-white/60"
              aria-hidden="true"
            />
          </ListboxButton>

          <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
            <ListboxOptions
              anchor="bottom start"
              className="[--anchor-gap:8px] [--anchor-padding:16px] absolute mx-0.5 bg-surface border border-border rounded-lg shadow-lg max-h-60 overflow-auto z-50 py-1"
              style={buttonWidth ? { width: `${buttonWidth}px` } : undefined}
            >
              {data.map((item, idx) => (
                <ListboxOption
                  key={idx}
                  value={item}
                  className="cursor-pointer select-none relative py-2 px-3 flex items-center gap-2 text-sm text-gray-200 hover:bg-brand-purple/40 "
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
