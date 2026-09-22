"use client";

import { forwardRef, useEffect, useState } from "react";
import { useDebounce } from "@/lib/hooks/useDebounce";

interface Props {
  value: number | undefined;
  min?: number;
  max?: number;
  onChange: (value: number | undefined) => void;
  className?: string;
}

const NumberField = forwardRef<HTMLInputElement, Props>(function NumberField(
  { value, onChange, min = undefined, max = undefined, className = "" },
  ref,
) {
  const [number, setNumber] = useState<number | undefined>(value);
  const debouncedNumber = useDebounce(number, 400);

  useEffect(() => {
    setNumber(value);
  }, [value]);

  useEffect(() => {
    if (debouncedNumber !== value && debouncedNumber !== undefined) {
      onChange(debouncedNumber);
    }
  }, [debouncedNumber, onChange, value]);

  function handleChange(newNumber: number | undefined) {
    if (newNumber === undefined) {
      setNumber(undefined);
      return;
    }

    const boundedNumber = Math.min(max ?? newNumber, Math.max(min ?? newNumber, newNumber));
    setNumber(boundedNumber);
  }

  return (
    <input
      type="number"
      ref={ref}
      min={min}
      max={max}
      value={number}
      onChange={(e) => {
        const inputValue = e.target.value;
        handleChange(inputValue === "" ? undefined : Number(inputValue));
      }}
      className={`no-spinner transition-all ${className}`}
    />
  );
});

export default NumberField;
