import { Combobox, Input, InputBase, Loader, Text, useCombobox } from "@mantine/core";
import { useState } from "react";

type Props<T> = {
  fetchMethod: () => Promise<T[]>;
  onSelect: (value: T | null) => void;
  idPredicate: (item: T) => string;
  namePredicate: (item: T) => string;
  value?: DefaultSelectedItem | null;
};

export class DefaultSelectedItem {
  id: string;
  name: string;

  public constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
}

export function SelectAsync<T>({ fetchMethod, onSelect, idPredicate, namePredicate, value: initialValue }: Props<T>) {
  const [value, setValue] = useState<string | null>(initialValue?.id ?? null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<T[]>([]);

  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
    onDropdownOpen: () => {
      if (data.length === 0 && !loading) {
        setLoading(true);
        fetchMethod().then((response) => {
          setData(response);
          setLoading(false);
          combobox.resetSelectedOption();
        });
      }
    },
  });

  const options = data.map((item) => (
    <Combobox.Option value={idPredicate(item)} key={idPredicate(item)}>
      {namePredicate(item)}
    </Combobox.Option>
  ));

  return (
    <Combobox
      store={combobox}
      withinPortal={false}
      onOptionSubmit={(val) => {
        setValue(val);
        combobox.closeDropdown();
        onSelect(data.find((item) => idPredicate(item) === val) || null);
      }}
    >
      <Combobox.Target targetType="button">
        <InputBase
          component="button"
          type="button"
          pointer
          rightSection={loading ? <Loader size={18} /> : <Combobox.Chevron />}
          onClick={() => combobox.toggleDropdown()}
          rightSectionPointerEvents="none"
        >
          {value && data.find((item) => idPredicate(item) === value) ? (
            <Text style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxLines: 1 }}>
              {namePredicate(data.find((item) => idPredicate(item) === value)!)}
            </Text>
          ) : initialValue ? (
            <Text style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxLines: 1 }}>
              {initialValue.name}
            </Text>
          ) : (
            <Input.Placeholder>Pick value</Input.Placeholder>
          )}
        </InputBase>
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options style={{ overflowY: "auto" }}>
          {loading ? (
            <Combobox.Empty>Loading....</Combobox.Empty>
          ) : options.length > 0 ? (
            options
          ) : (
            <Combobox.Empty>No matching items found</Combobox.Empty>
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
