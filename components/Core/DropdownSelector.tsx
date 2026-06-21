import { LucideIcon } from "lucide-react";
import { useState, useEffect, type ChangeEvent } from "react";

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
  const initialIndex = value !== undefined ? data.findIndex((item) => item.value === value) : -1;
  const [selectedIndex, setSelectedIndex] = useState<number>(initialIndex);

  const selectedOption = selectedIndex >= 0 && data[selectedIndex] ? data[selectedIndex] : undefined;

  useEffect(() => {
    const idx = value !== undefined ? data.findIndex((item) => item.value === value) : -1;
    setSelectedIndex(idx);
  }, [value, data]);

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const idx = Number(event.target.value);
    if (Number.isNaN(idx) || idx < 0 || idx >= data.length) {
      setSelectedIndex(-1);
      return;
    }
    setSelectedIndex(idx);
    onChange?.(data[idx].value);
  }
  return (
    <div className="relative group min-w-[200px]">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 group-focus-within:text-brand-cyan transition-colors z-10">
        {(() => {
          const Icon = selectedOption?.Icon;
          return Icon ? <Icon size={16} /> : null;
        })()}
      </div>
      <select
        value={selectedIndex >= 0 ? String(selectedIndex) : ""}
        onChange={handleChange}
        className="w-full bg-surface/80 backdrop-blur-md border border-border hover:border-gray-500 rounded-xl py-2.5 pl-10 pr-8 text-sm font-bold text-gray-200 focus:outline-none focus:ring-1 focus:border-brand-cyan focus:ring-brand-cyan appearance-none transition-all cursor-pointer shadow-sm"
        disabled={disabled}
      >
        {data.map((item, idx) => (
          <option key={idx} value={String(idx)} className="bg-background text-gray-100">
            {labelFn(item.value)}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
          <path
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
            fillRule="evenodd"
          ></path>
        </svg>
      </div>
    </div>
  );
}
