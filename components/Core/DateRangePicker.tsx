"use client";

import { useState } from "react";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css"; // Optional base styles

interface Props {
  value: DateRange | undefined;
  onChange: (value: DateRange | undefined) => void;
}

export default function DateRangePicker({ value, onChange }: Props) {
  const [range, setRange] = useState<DateRange | undefined>(value);

  function handleSelect(newRange: DateRange | undefined) {
    setRange(newRange);
    onChange(newRange);
  }

  return (
    <div className="p-4 border border-border rounded-lg max-w-sm bg-surface shadow-sm">
      <DayPicker mode="range" selected={range} onSelect={handleSelect} className="text-sm" animate />
    </div>
  );
}
