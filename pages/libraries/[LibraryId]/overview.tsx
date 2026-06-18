import { useMemo } from "react";
import { useTranslation } from "next-i18next/pages";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";
import { PieChart } from "lucide-react";

import type { LibrariesWithStats } from "@/lib/models/librariesWithStats";
import ItemTypes from "@/lib/models/enums/ItemTypes";
import StatType from "@/lib/models/enums/StatType";

import RecentlyAdded from "@/components/RecentlyAdded/RecentlyAdded";
import StatsCard from "@/components/StatsCard/StatsCard";
import LastWatched from "@/components/LastWatched/LastWatched";

type Props = {
  library: LibrariesWithStats | null;
};

export default function LibraryOverView({ library }: Props) {
  const { t } = useTranslation("common");

  // Avoid running queries if library isn't loaded yet
  const recentQuery = useMemo(() => {
    if (!library) return undefined;
    return new GridifyQueryBuilder()
      .addCondition("LibraryId", op.Equal, library.id)
      .and()
      .addCondition("Type", op.NotEqual, ItemTypes.Season.toString())
      .and()
      .addCondition("Type", op.NotEqual, ItemTypes.Series.toString())
      .build();
  }, [library]);

  const lastWatchedQuery = useMemo(() => {
    if (!library) return undefined;
    return new GridifyQueryBuilder()
      .addCondition("LibraryId", op.Equal, library.id)
      .and()
      .addCondition("Type", op.NotEqual, ItemTypes.Season.toString())
      .and()
      .addCondition("Type", op.NotEqual, ItemTypes.Series.toString())
      .and()
      .addCondition("LatestActivityDate", op.NotEqual, "null")
      .addOrderBy("LatestActivityDate", true);
  }, [library]);

  if (!library) return null;

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pt-6">
      
      {/* Library Stats */}
      <div className="w-full">
        <StatsCard type={StatType.Library} id={library.id ?? ""} />
      </div>

      {/* Genres Chart Placeholder */}
      <div className="w-full">
        <div className="flex items-center gap-3 mb-6">
          <PieChart className="text-brand-emerald" size={28} />
          <h2 className="text-2xl font-black text-white tracking-tight">
            {t("library.genres", "Genres")}
          </h2>
        </div>
        
        <div className="bg-surface/30 border-2 border-dashed border-border rounded-3xl h-[340px] flex flex-col items-center justify-center text-center shadow-inner">
          <PieChart size={48} className="text-gray-500 opacity-30 mb-4 animate-pulse" />
          <span className="text-lg font-bold text-gray-300">
            {t("library.charts_coming_soon", "Charts Coming Soon")}
          </span>
          <span className="text-sm text-gray-500 font-medium mt-1">
            {t("library.charts_placeholder", "(Charts placeholder — scaffolded)")}
          </span>
        </div>
      </div>

      {/* Recently Added Section */}
      <div className="w-full">
        <RecentlyAdded gridify={recentQuery} />
      </div>

      {/* Last Watched Section */}
      <div className="w-full">
        <LastWatched gridify={lastWatchedQuery} />
      </div>

    </div>
  );
}