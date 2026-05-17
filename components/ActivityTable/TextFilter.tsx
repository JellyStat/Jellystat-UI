import { ActionIcon, TextInput } from "@mantine/core";
import { IconSearch, IconX } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import FilterItem from "./FilterItem";

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

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.trim() === value.trim() && query.trim() !== "") return; // Don't trigger onChange if the value hasn't changed after trimming
      if (query.trim() === "") {
        onChange(null);
        return;
      }

      onChange(new FilterItem(keyName, query.trim()));
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [query]);

  return (
    <TextInput
      label="Employees"
      description="Show employees whose names include the specified text"
      placeholder="Search employees..."
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
