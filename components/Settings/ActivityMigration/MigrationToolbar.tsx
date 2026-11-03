import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input, SegmentedControl, Select } from "@/components/ui";

export type StatusFilter = "all" | "notLinked" | "ready";
export type TypeFilter = "all" | "episodes" | "movies";

type Props = {
  status: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  search: string;
  onSearchChange: (value: string) => void;
  type: TypeFilter;
  onTypeChange: (value: TypeFilter) => void;
};

export default function MigrationToolbar({ status, onStatusChange, search, onSearchChange, type, onTypeChange }: Props) {
  const { t } = useTranslation("common");

  const typeLabels: Record<TypeFilter, string> = {
    all: t("common.all", "All"),
    episodes: t("settings.migration_type_episodes", "Episodes"),
    movies: t("settings.migration_type_movies", "Movies"),
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <SegmentedControl<StatusFilter>
        label={t("settings.migration_filter_label", "Filter by status")}
        value={status}
        onChange={onStatusChange}
        options={[
          { value: "all", label: t("common.all", "All") },
          { value: "notLinked", label: t("common.not_linked", "Not linked") },
          { value: "ready", label: t("common.ready", "Ready") },
        ]}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.currentTarget.value)}
          placeholder={t("settings.migration_search_placeholder", "Search unlinked titles")}
          aria-label={t("settings.migration_search_placeholder", "Search unlinked titles")}
          leftIcon={<Search size={16} />}
          wrapperClassName="sm:w-72"
        />
        <Select<TypeFilter>
          data={(["all", "episodes", "movies"] as TypeFilter[]).map((value) => ({ value }))}
          value={type}
          onChange={onTypeChange}
          labelFn={(value) => typeLabels[value]}
          widthPx={200}
        />
      </div>
    </div>
  );
}
