import { useMemo } from "react";
import { useTranslation } from "next-i18next/pages";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";
import { Clapperboard, HardDrive, PieChart } from "lucide-react";

import type { LibrariesWithStats } from "@/lib/models/librariesWithStats";
import ItemTypes from "@/lib/models/enums/ItemTypes";
import StatType from "@/lib/models/enums/StatType";

import RecentlyAdded from "@/components/RecentlyAdded/RecentlyAdded";
import StatsCard from "@/components/StatsCard/StatsCard";
import LastWatched from "@/components/LastWatched/LastWatched";
import GenreStatsCard from "@/components/GenreStatCards/GenreStats";
import ResolutionStatsCard from "@/components/StatsCard/ResolutionStatsCard";
import CodecStatsCard from "@/components/StatsCard/CodecStatsCard";
import LibraryTypeIcons from "@/lib/declarations/libraryIcons";
import ItemTypeIcons from "@/lib/declarations/itemIcons";
import LibraryInfoOverviewCard from "@/components/LibraryOverview/LibraryInfoOverviewCard";

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
      .and()
      .addCondition("Type", op.NotEqual, ItemTypes.Unknown.toString())
      .build();
  }, [library]);

  const codecQuery = useMemo(() => {
    if (!library) return undefined;
    return new GridifyQueryBuilder().addCondition("LibraryId", op.Equal, library.id).build();
  }, [library]);

  const resolutionQuery = useMemo(() => {
    if (!library) return undefined;
    return new GridifyQueryBuilder().addCondition("LibraryId", op.Equal, library.id).build();
  }, [library]);

  const lastWatchedQuery = useMemo(() => {
    if (!library) return undefined;
    return new GridifyQueryBuilder().addCondition("LibraryId", op.Equal, library.id);
  }, [library]);

  if (!library) return null;

  const gridify = new GridifyQueryBuilder().addCondition("item.LibraryId", op.Equal, library.id).build();

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pt-6">
      {/* Library Type Counts */}
      <div className="w-full">
        <LibraryInfoOverviewCard library={library} />
      </div>

      {/* Library Stats */}
      <div className="w-full">
        <StatsCard type={StatType.Library} id={library.id ?? ""} />
      </div>

      {/* Genres Chart */}
      <div className="w-full">
        <GenreStatsCard gridify={gridify} />
      </div>

      {/* Codec and Resolution Stats */}
      <div className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <CodecStatsCard gridify={codecQuery} />
          <ResolutionStatsCard gridify={resolutionQuery} />
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
