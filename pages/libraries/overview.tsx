import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Container, Title, Loader, Text, Group, Tabs, Card, SimpleGrid } from "@mantine/core";
import { getLibraries, getLibraryItems, API_BASE } from "../../lib/api";
import type { LibrariesWithStats } from "../../lib/models/librariesWithStats";
import type { ItemsWithParentData } from "../../lib/models/itemsWithParentData";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";
import ItemCards from "../../components/ItemsCards/ItemCards";
import RecentlyAdded from "@/components/RecentlyAdded/RecentlyAdded";
import LibraryTypeIcons from "@/lib/declarations/libraryIcons";
import { IconPhoto } from "@tabler/icons-react";
import StatsCard from "@/components/StatsCard/StatsCard";
import StatType from "@/lib/models/enums/StatType";
import LastWatched from "@/components/LastWatched/LastWatched";

type Props = {
  library: LibrariesWithStats | null;
};

export default function LibraryOverView({ library }: Props) {
  if (!library) return null;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginTop: 16 }}>
        <StatsCard type={StatType.Library} serverId={library?.serverId} id={library?.id ?? ""} />
      </div>

      <div style={{ marginTop: 20 }}>
        <Title order={3}>Genres</Title>
        <Card style={{ height: 340, marginTop: 8 }}>
          <Text color="dimmed">(Charts placeholder — scaffolded)</Text>
        </Card>
      </div>

      <div style={{ marginTop: 20 }}>
        <RecentlyAdded gridify={new GridifyQueryBuilder().addCondition("LibraryId", op.Equal, library.id).build()} />
      </div>

      <div style={{ marginTop: 20 }}>
        <LastWatched
          gridify={new GridifyQueryBuilder()
            .addCondition("LibraryId", op.Equal, library.id)
            .and()
            .addCondition("LatestActivityDate", op.NotEqual, "null")
            .addOrderBy("LatestActivityDate", true)
            .build()}
          serverId={library.serverId}
        />
      </div>
    </div>
  );
}
