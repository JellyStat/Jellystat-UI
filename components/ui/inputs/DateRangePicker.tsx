import 'react-day-picker/dist/style.css';
import { useState, type Ref } from 'react';
import { DayPicker, type DateRange } from 'react-day-picker';

export type DateRangePickerProps = {
  value: DateRange | undefined;
  onChange: (value: DateRange | undefined) => void;
  ref?: Ref<HTMLDivElement>;
};

// Range calendar in an overlay panel; usually placed inside a headlessui PopoverPanel.
// Accent colours come from the .rdp-root overrides in styles/globals.css.
export default function DateRangePicker({ value, onChange, ref }: DateRangePickerProps) {
  const [range, setRange] = useState<DateRange | undefined>(value);

  function handleSelect(newRange: DateRange | undefined) {
    setRange(newRange);
    onChange(newRange);
  }

  return (
    <div
      ref={ref}
      className="p-4 border border-border rounded-2xl max-w-sm bg-surface shadow-2xl shadow-black/40"
    >
      <DayPicker
        mode="range"
        selected={range}
        onSelect={handleSelect}
        className="text-sm"
        animate
      />
    </div>
  );
}
