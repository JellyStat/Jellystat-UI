import { Checkbox, Group, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import FilterItem from "./FilterItem";
import { useDebouncedValue } from "@mantine/hooks";

export default function BooleanFilter({
  keyName,
  label,
  value,
  onChange,
}: {
  keyName: string;
  label: string;
  value: boolean | null;
  onChange: (value: FilterItem | null) => void;
}) {
  const [query, setQuery] = useState<boolean | null>(value);
  const [debounced] = useDebouncedValue(query, 200);

  const equalBooleans = (a: boolean | null, b: boolean | null) => {
    return a === b;
  };

  useEffect(() => {
    // If the debounced value is equal to the current value, do nothing
    if (equalBooleans(debounced, value)) return;

    // If both are null -> clear the filter
    if (debounced == null) {
      onChange(null);
      return;
    }

    onChange(new FilterItem(keyName, debounced));
  }, [debounced, value, keyName, onChange]);

  function cycleValue() {
    switch (query) {
      case null:
        setQuery(true);
        break;
      case true:
        setQuery(false);
        break;
      case false:
        setQuery(null);
        break;
    }
  }

  const checked = !!debounced;
  const intermediate = debounced === null;

  return (
    <Group>
      <Text>{label}</Text>
      <Checkbox checked={checked} indeterminate={intermediate} onChange={cycleValue} />
    </Group>
  );
}
