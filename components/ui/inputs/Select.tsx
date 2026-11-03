import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { Check, ChevronDown, type LucideIcon } from 'lucide-react';
import { cn } from '../cn';
import Spinner from '../primitives/Spinner';
import { focusRing } from '../tones';

export type SelectOption<T> = {
  value: T;
  Icon?: LucideIcon;
};

export type SelectProps<T> = {
  data: SelectOption<T>[];
  value?: T;
  labelFn: (value: T) => string;
  onChange?: (value: T) => void;
  disabled?: boolean;
  placeholder?: string;
  // Shown when nothing is selected, or when the selected option has no icon.
  leftIcon?: LucideIcon;
  loading?: boolean;
  emptyDataMessage?: string;
  widthPx?: number;
  className?: string;
};

// Single-value dropdown on headlessui Listbox. Same height as the md Input/Button.
export default function Select<T>({
  data,
  value,
  labelFn,
  onChange,
  disabled,
  placeholder = 'Select',
  leftIcon,
  loading = false,
  emptyDataMessage = 'No options available',
  widthPx = 200,
  className,
}: SelectProps<T>) {
  const selected = value !== undefined ? data.find((d) => d.value === value) : undefined;
  const Icon = selected?.Icon ?? leftIcon;
  const hasLeftIcon = loading || Icon != null;

  return (
    <div
      className={cn('relative max-w-full', className)}
      style={{ minWidth: `min(${widthPx}px, calc(100vw - 2rem))` }}
    >
      <Listbox
        value={selected ?? null}
        onChange={(opt: SelectOption<T> | null) => opt && onChange?.(opt.value)}
        disabled={disabled}
      >
        <ListboxButton
          className={cn(
            'relative w-full flex items-center bg-surface/80 backdrop-blur-md border border-border rounded-xl py-2.5 pr-10 text-sm font-bold text-gray-200 shadow-sm transition-all cursor-pointer hover:border-border-strong data-open:border-primary disabled:opacity-50 disabled:cursor-not-allowed',
            hasLeftIcon ? 'pl-10' : 'pl-4',
            focusRing
          )}
        >
          {hasLeftIcon && (
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
              {loading ? <Spinner size={16} /> : Icon && <Icon size={16} />}
            </span>
          )}
          <span className={cn('min-w-0 flex-1 truncate text-left', !selected && 'text-gray-500')}>
            {selected ? labelFn(selected.value) : placeholder}
          </span>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute right-3.5 size-4 text-gray-500"
          />
        </ListboxButton>

        <ListboxOptions
          anchor="bottom start"
          transition
          className="z-50 w-(--button-width) [--anchor-gap:8px] [--anchor-padding:16px] max-h-60 overflow-auto rounded-lg border border-border bg-surface p-1 shadow-lg shadow-black/40 focus:outline-none transition duration-100 ease-in data-leave:data-closed:opacity-0"
        >
          {data.length === 0 && !loading && (
            <div className="px-3 py-2 text-sm text-gray-500">{emptyDataMessage}</div>
          )}
          {data.map((item, idx) => (
            <ListboxOption
              key={idx}
              value={item}
              className="group flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-200 cursor-pointer select-none data-focus:bg-primary/40 data-selected:text-white data-selected:font-bold"
            >
              {item.Icon && <item.Icon size={16} className="shrink-0" />}
              <span className="truncate">{labelFn(item.value)}</span>
              <Check
                aria-hidden="true"
                className="ml-auto size-4 shrink-0 invisible group-data-selected:visible"
              />
            </ListboxOption>
          ))}
        </ListboxOptions>
      </Listbox>
    </div>
  );
}
