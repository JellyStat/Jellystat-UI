import { ActionIcon, TextInput } from "@mantine/core";
import { IconSearch, IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import FilterItem from "./FilterItem.ts";
import { useDebouncedValue } from "@mantine/hooks";

export default function TextFilter({
  keyName,
  value,
  onChange,
}: {
  keyName: string;
  value: string;
  onChange: (value: FilterItem | null) => void;
}) {
  const [query, setQuery] = useState(value);
  const [debounced] = useDebouncedValue(query, 200);

  useEffect(() => {
    if (debounced.trim() === value.trim() && debounced.trim() !== "") return; // Don't trigger onChange if the value hasn't changed after trimming
    if (debounced.trim() === "") {
      onChange(null);
      return;
    }

    onChange(new FilterItem(keyName, debounced.trim()));
  }, [debounced]);

  return (
    <TextInput
      leftSection={<IconSearch size={16} />}
      rightSection={
        <ActionIcon size="sm" variant="transparent" c="dimmed" onClick={() => setQuery("")}>
          <IconX size={14} />
        </ActionIcon>
      }
      value={query}
      onChange={(e) => setQuery(e.currentTarget.value)}
    />
  );
}
