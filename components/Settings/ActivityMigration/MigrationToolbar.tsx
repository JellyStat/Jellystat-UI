import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import DropdownSelector from "@/components/Core/DropdownSelector";

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

  const statusOptions: { id: StatusFilter; label: string }[] = [
    { id: "all", label: t("settings.migration_filter_all", "All") },
    { id: "notLinked", label: t("settings.migration_filter_not_linked", "Not Linked") },
    { id: "ready", label: t("settings.migration_filter_ready", "Ready") },
  ];

  const typeLabels: Record<TypeFilter, string> = {
    all: t("settings.migration_type_all", "Episodes & Movies"),
    episodes: t("settings.migration_type_episodes", "Episodes"),
    movies: t("settings.migration_type_movies", "Movies"),
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div className="flex overflow-x-auto custom-scrollbar">
        <div
          role="tablist"
          aria-label={t("settings.migration_filter_label", "Filter by status")}
          className="flex items-center p-1.5 bg-surface/60 backdrop-blur-xl border border-border rounded-2xl shadow-inner w-max"
        >
          {statusOptions.map((option) => {
            const isActive = status === option.id;
            return (
              <button
                key={option.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onStatusChange(option.id)}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 cursor-pointer ${
                  isActive
                    ? "bg-brand-cyan text-black shadow-md shadow-brand-cyan/20"
                    : "text-gray-400 hover:text-white hover:bg-surface-hover"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative sm:w-72">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 pointer-events-none">
            <Search size={16} />
          </div>
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.currentTarget.value)}
            placeholder={t("settings.migration_search_placeholder", "Search unlinked titles")}
            aria-label={t("settings.migration_search_placeholder", "Search unlinked titles")}
            className="w-full bg-surface/80 border border-border hover:border-gray-500 rounded-xl py-2.5 pl-9 pr-4 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-brand-cyan transition-all shadow-inner"
          />
        </div>
        <DropdownSelector<TypeFilter>
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
