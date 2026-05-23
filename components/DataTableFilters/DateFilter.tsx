import { Button, Stack } from "@mantine/core";
import { useEffect, useState } from "react";
import FilterItem from "./FilterItem";
import { DatePicker, DatesRangeValue } from "@mantine/dates";
import { useDebouncedValue } from "@mantine/hooks";

export default function DateFilter({
  keyName,
  value,
  onChange,
}: {
  keyName: string;
  value: DatesRangeValue;
  onChange: (value: FilterItem | null) => void;
}) {
  const [query, setQuery] = useState<DatesRangeValue>(value);
  const [debounced] = useDebouncedValue(query, 200);

  const equalDates = (a: any, b: any) => {
    if (a == null && b == null) return true;
    if (a == null || b == null) return false;
    return new Date(a).getTime() === new Date(b).getTime();
  };

  useEffect(() => {
    if (!debounced || !Array.isArray(debounced)) return;

    const [start, end] = debounced;

    // If the debounced value is equal to the current value, do nothing
    if (equalDates(start, value[0]) && equalDates(end, value[1])) return;

    // If both are null -> clear the filter
    if (start == null && end == null) {
      onChange(null);
      return;
    }

    // If exactly one is null -> don't trigger change (user hasn't completed range)
    if (start == null || end == null) return;

    onChange(new FilterItem(keyName, debounced));
  }, [debounced, value, keyName, onChange]);

  return (
    <Stack>
      <DatePicker maxDate={new Date()} type="range" value={query} onChange={setQuery} />
      <Button
        disabled={!query}
        variant="light"
        onClick={() => {
          setQuery([null, null]);
        }}
      >
        Clear
      </Button>
    </Stack>
  );
}
