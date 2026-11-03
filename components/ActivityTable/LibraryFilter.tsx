import { Library as LibraryIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { LibrariesWithStats } from "@/lib/models/librariesWithStats";
import { MultiSelect } from "@/components/ui";

type Props = {
  libraries: LibrariesWithStats[];
  /** Selected library ids; an empty list means "all libraries" (no filter). */
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
};

export default function LibraryFilter({ libraries, value, onChange, disabled }: Props) {
  const { t } = useTranslation("common");

  const allIds = libraries.map((l) => l.id);
  // Empty means "all libraries", so show every box ticked in that case
  const checkedIds = value.length === 0 ? allIds : value;
  // Normalise: ticking every library (or unticking all of them) means no filter
  const handleChange = (ids: string[]) => onChange(ids.length === 0 || ids.length >= allIds.length ? [] : ids);

  const selectedNames = libraries.filter((l) => value.includes(l.id)).map((l) => l.name);
  const label =
    value.length === 0
      ? t("activity.all_libraries", "All libraries")
      : value.length === 1
        ? (selectedNames[0] ?? t("activity.one_library", "1 library"))
        : t("activity.n_libraries", "{{count}} libraries", { count: value.length });

  return (
    <MultiSelect<string>
      options={libraries.map((lib) => ({ value: lib.id, label: lib.name }))}
      value={checkedIds}
      onChange={handleChange}
      triggerLabel={label}
      leftIcon={LibraryIcon}
      disabled={disabled || libraries.length === 0}
      header={
        value.length > 0 ? (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs font-bold text-gray-400 hover:text-accent transition-colors cursor-pointer"
          >
            {t("activity.show_all_libraries", "Show all libraries")}
          </button>
        ) : undefined
      }
    />
  );
}
