import React, { useEffect, useMemo, useState } from "react";
import { Title, Group, SimpleGrid } from "@mantine/core";
import { IconChartBarPopular } from "@tabler/icons-react";
import client from "@/lib/api";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";
import { LibrariesWithStats } from "@/lib/models/librariesWithStats";
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
      <Group style={{ width: "100%", justifyContent: "space-between" }}>
        <Title order={2}>Library Overview</Title>
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg" style={{ width: "100%" }}>
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
