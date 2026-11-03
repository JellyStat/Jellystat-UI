import React, { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import FilterItem from "./FilterItem";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useTranslation } from "react-i18next";
import { Input, InputAction } from "@/components/ui";

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
  const [disableDebounce, setDisableDebounce] = useState(false);
  const debounced = useDebounce(query, 400);

  const { t } = useTranslation("common");

  useEffect(() => {
    if (disableDebounce) {
      setDisableDebounce(false);
      return;
    }
    if (debounced.trim() === value.trim()) return;

    if (debounced.trim() === "") {
      onChange(null);
    } else {
      onChange(new FilterItem(keyName, debounced.trim()));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const clearQuery = () => {
    setDisableDebounce(true);
    setQuery("");
    onChange(null);
  };

  return (
    <Input
      size="sm"
      type="text"
      placeholder={t("common.filter", "Filter")}
      aria-label={t("common.filter", "Filter")}
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      leftIcon={<Search size={14} />}
      wrapperClassName="w-full min-w-[100px]"
      rightSlot={
        query ? (
          <InputAction size="sm" onClick={clearQuery} title={t("common.clear", "Clear")} className="hover:text-danger">
            <X size={14} />
          </InputAction>
        ) : undefined
      }
    />
  );
}
