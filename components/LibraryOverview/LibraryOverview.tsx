import React, { useEffect, useMemo, useState } from "react";
import { Card, Title, Group, Popover, Checkbox, Button, SimpleGrid, Text, Loader, ActionIcon, NumberInput } from "@mantine/core";
import { IconChartBarPopular, IconDeviceDesktop, IconDotsVertical, icons, IconUser } from "@tabler/icons-react";
import client from "@/lib/api";
import StatType from "@/lib/models/enums/StatType";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";
import WatchStatCard, { WatchStatItem } from "../WatchStatCard/WatchStatCard";
import ItemTypes from "@/lib/models/enums/ItemTypes";
import { ItemsWithStats } from "@/lib/models/itemsWithStats";
import { LibrariesWithStats } from "@/lib/models/librariesWithStats";
import LibraryTypeIcons from "@/lib/declarations/libraryIcons";
import { MostUsedClients } from "@/lib/models/mostUsedClients";
import { UserStats } from "@/lib/models/userStats";
import { TranscodeStats } from "@/lib/models/transcodeStats";
import LibraryOverviewCard from "./LibraryOverviewCard";
import LibraryTypes from "@/lib/models/enums/LibraryTypes";

export default function LibraryOverview() {
  const [libraryStats, setLibraryStats] = useState<LibrariesWithStats[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchLibraryStats() {
      setLoading(true);
      try {
        // Example API call - replace with actual endpoint and query
        const query = new GridifyQueryBuilder().setPageSize(100).build();
        const res = await client.Stats.getLibraryStats({ days: 0 }, query);
        if (!mounted) return;
        setLibraryStats(res?.data ?? []);
      } catch (er: any) {
        console.error("Failed to load most viewed movies", er);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchLibraryStats();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Group style={{ flexDirection: "column", alignItems: "start" }}>
      <Group style={{ width: "100%", justifyContent: "space-between" }} mb={10} mt={10}>
        <Title order={2}>Library Overview</Title>
      </Group>
      <SimpleGrid cols={3}>
        <LibraryOverviewCard
          title="MOVIE LIBRARIES"
          libraries={libraryStats.filter((lib) => lib.type === LibraryTypes.Movies)}
          Icon={IconChartBarPopular}
        />
        <LibraryOverviewCard
          title="SHOW LIBRARIES"
          libraries={libraryStats.filter((lib) => lib.type === LibraryTypes.Series)}
          Icon={IconChartBarPopular}
        />
      </SimpleGrid>
    </Group>
  );
}
