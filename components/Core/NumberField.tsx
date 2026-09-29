"use client";

import { forwardRef, useEffect, useRef, useState } from "react";

interface Props {
  value: number | undefined;
  min?: number;
  max?: number;
  onChange: (value: number | undefined) => void;
  className?: string;
  readonly?: boolean;
}

const NumberField = forwardRef<HTMLInputElement, Props>(function NumberField(
  { value, onChange, min = undefined, max = undefined, className = "", readonly = false },
  ref,
) {
  const [number, setNumber] = useState<number | undefined>(value);
  const onChangeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (onChangeTimeout.current) {
      clearTimeout(onChangeTimeout.current);
      onChangeTimeout.current = null;
    }
    setNumber(value);
  }, [value]);

  useEffect(() => {
    return () => {
      if (onChangeTimeout.current) clearTimeout(onChangeTimeout.current);
    };
  }, []);

  function handleChange(newNumber: number | undefined) {
    if (onChangeTimeout.current) {
      clearTimeout(onChangeTimeout.current);
      onChangeTimeout.current = null;
    }

    if (newNumber === undefined) {
      setNumber(undefined);
      return;
    }

    const boundedNumber = Math.min(max ?? newNumber, Math.max(min ?? newNumber, newNumber));
    setNumber(boundedNumber);
    onChangeTimeout.current = setTimeout(() => {
      onChange(boundedNumber);
      onChangeTimeout.current = null;
    }, 400);
  }

  return (
    <input
      type="number"
      ref={ref}
      min={min}
      max={max}
      value={number}
      onChange={(e) => {
        if (readonly) return;
        const inputValue = e.target.value;
        handleChange(inputValue === "" ? undefined : Number(inputValue));
      }}
      className={`no-spinner transition-all ${className} ${readonly ? "bg-surface/50 cursor-default" : ""}`}
      readOnly={readonly}
    />
  );
});

export default NumberField;
