import { Title, Text, Card } from "@mantine/core";
import type { LibrariesWithStats } from "@/lib/models/librariesWithStats";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";
import RecentlyAdded from "@/components/RecentlyAdded/RecentlyAdded";
import StatsCard from "@/components/StatsCard/StatsCard";
import StatType from "@/lib/models/enums/StatType";
import LastWatched from "@/components/LastWatched/LastWatched";
import ItemTypes from "@/lib/models/enums/ItemTypes";
import MediaGrid from "@/components/MediaGrid/MediaGrid";
import { useMemo } from "react";

type Props = {
  library: LibrariesWithStats | null;
};

export default function LibraryMedia({ library }: Props) {
  if (!library) return null;

  const libraryMediaQuery = useMemo(
    () =>
      new GridifyQueryBuilder()
        .addCondition("LibraryId", op.Equal, library.id)
        .and()
        .startGroup()
        .addCondition("Type", op.Equal, ItemTypes.Movie.toString())
        .or()
        .addCondition("Type", op.Equal, ItemTypes.Series.toString())
        .endGroup(),
    [library.id],
  );

  return (
    <div style={{ padding: 20 }}>
      <MediaGrid gridify={libraryMediaQuery} />
    </div>
  );
}
