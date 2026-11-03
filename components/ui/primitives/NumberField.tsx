import { useEffect, useRef, useState, type Ref } from 'react';
import { cn } from '../cn';

export type NumberFieldProps = {
  value: number | undefined;
  min?: number;
  max?: number;
  // Called 400ms after the user stops typing, with the value clamped to min/max.
  onChange: (value: number | undefined) => void;
  className?: string;
  readonly?: boolean;
  ref?: Ref<HTMLInputElement>;
};

export default function NumberField({
  value,
  onChange,
  min,
  max,
  className,
  readonly = false,
  ref,
}: NumberFieldProps) {
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
      if (onChangeTimeout.current) {
        clearTimeout(onChangeTimeout.current);
      }
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
      value={number ?? ''}
      onChange={(e) => {
        if (readonly) {
          return;
        }
        const inputValue = e.target.value;
        handleChange(inputValue === '' ? undefined : Number(inputValue));
      }}
      className={cn(
        'no-spinner transition-all',
        className,
        readonly && 'bg-surface cursor-default'
      )}
      readOnly={readonly}
    />
  );
}
