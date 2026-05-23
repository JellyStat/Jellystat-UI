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
import NotFound from "../ErrorCards/NotFound";

export default function WatchStatCards() {
  const [mostViewedMovies, setMostViewedMovies] = useState<WatchStatItem[]>([]);
  const [mostPopularMovies, setMostPopularMovies] = useState<WatchStatItem[]>([]);
  const [mostViewedShows, setMostViewedShows] = useState<WatchStatItem[]>([]);
  const [mostPopularShows, setMostPopularShows] = useState<WatchStatItem[]>([]);
  const [mostViewedLibrary, setMostViewedLibrary] = useState<WatchStatItem[]>([]);
  const [mostUsedClients, setMostUsedClients] = useState<WatchStatItem[]>([]);
  const [mostActiveUsers, setMostActiveUsers] = useState<WatchStatItem[]>([]);
  const [mostConcurrentStreams, setMostConcurrentStreams] = useState<WatchStatItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState<string | number>(31);

  useEffect(() => {
    let mounted = true;
    async function fetchMostViewedMovies() {
      setLoading(true);
      try {
        // Example API call - replace with actual endpoint and query
        const query = new GridifyQueryBuilder()
          .addCondition("type", op.Equal, ItemTypes.Movie.toString())
          .and()
          .addCondition("playCount", op.GreaterThan, 0)
          .setPageSize(5)
          .build();
        const res = await client.Stats.getItemStats({ days: days as number }, query);
        if (!mounted) return;
        const items =
          res?.data?.map((m: ItemsWithStats) => ({
            id: m.id,
            name: m.name,
            value: m.playCount ?? 0,
            imageTag: m.imageTag, // force different image for testing
            type: m.type,
            serverId: m.serverId,
            navLink: `/libraries/items/${m.id}`,
          })) || [];
        setMostViewedMovies(items);
      } catch (er: any) {
        console.error("Failed to load most viewed movies", er);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    async function fetchMostPopularMovies() {
      setLoading(true);
      try {
        // Example API call - replace with actual endpoint and query
        const query = new GridifyQueryBuilder()
          .addCondition("type", op.Equal, ItemTypes.Movie.toString())
          .and()
          .addCondition("playCount", op.GreaterThan, 0)
          .setPageSize(5)
          .build();
        const res = await client.Stats.getMostPopularItems({ days: days as number }, query);
        if (!mounted) return;
        const items =
          res?.data?.map((m: ItemsWithStats) => ({
            id: m.id,
            name: m.name,
            value: m.playCount ?? 0,
            imageTag: m.imageTag, // force different image for testing
            type: m.type,
            serverId: m.serverId,
            navLink: `/libraries/items/${m.id}`,
          })) || [];
        setMostPopularMovies(items);
      } catch (er: any) {
        console.error("Failed to load most popular movies", er);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    async function fetchMostViewedShows() {
      setLoading(true);
      try {
        // Example API call - replace with actual endpoint and query
        const query = new GridifyQueryBuilder()
          .addCondition("type", op.Equal, ItemTypes.Series.toString())
          .and()
          .addCondition("playCount", op.GreaterThan, 0)
          .setPageSize(5)
          .build();
        const res = await client.Stats.getItemStats({ days: days as number }, query);
        if (!mounted) return;
        const items =
          res?.data?.map((m: ItemsWithStats) => ({
            id: m.id,
            name: m.name,
            value: m.playCount ?? 0,
            imageTag: m.imageTag, // force different image for testing
            type: m.type,
            serverId: m.serverId,
            navLink: `/libraries/items/${m.id}`,
          })) || [];
        setMostViewedShows(items);
      } catch (er: any) {
        console.error("Failed to load most viewed shows", er);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    async function fetchMostPopularShows() {
      setLoading(true);
      try {
        // Example API call - replace with actual endpoint and query
        const query = new GridifyQueryBuilder()
          .addCondition("type", op.Equal, ItemTypes.Series.toString())
          .and()
          .addCondition("playCount", op.GreaterThan, 0)
          .setPageSize(5)
          .build();
        const res = await client.Stats.getMostPopularItems({ days: days as number }, query);
        if (!mounted) return;
        const items =
          res?.data?.map((m: ItemsWithStats) => ({
            id: m.id,
            name: m.name,
            value: m.playCount ?? 0,
            imageTag: m.imageTag, // force different image for testing
            type: m.type,
            serverId: m.serverId,
            navLink: `/libraries/items/${m.id}`,
          })) || [];
        setMostPopularShows(items);
      } catch (er: any) {
        console.error("Failed to load most popular shows", er);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    async function fetchMostViewedLibraries() {
      setLoading(true);
      try {
        // Example API call - replace with actual endpoint and query
        const query = new GridifyQueryBuilder().addCondition("playCount", op.GreaterThan, 0).setPageSize(5).build();
        const res = await client.Stats.getLibraryStats({ days: days as number }, query);
        if (!mounted) return;
        const items =
          res?.data?.map((m: LibrariesWithStats) => ({
            id: m.id,
            name: m.name,
            value: m.playCount ?? 0,
            icon: LibraryTypeIcons[m.type],
            type: m.type,
            serverId: m.serverId,
            navLink: `/libraries/${m.id}`,
          })) || [];
        setMostViewedLibrary(items);
      } catch (er: any) {
        console.error("Failed to load most popular shows", er);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    async function fetchMostUsedClients() {
      setLoading(true);
      try {
        // Example API call - replace with actual endpoint and query
        const query = new GridifyQueryBuilder().addCondition("playCount", op.GreaterThan, 0).setPageSize(5).build();
        const res = await client.Stats.getMostUsedClients({ days: days as number }, query);
        if (!mounted) return;
        const items =
          res?.data?.map((m: MostUsedClients) => ({
            id: m.clientName,
            name: m.clientName,
            value: m.playCount ?? 0,
            icon: IconDeviceDesktop,
            serverId: m.latestActivity?.serverId ?? "",
          })) || [];
        setMostUsedClients(items);
      } catch (er: any) {
        console.error("Failed to load most used clients", er);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    async function fetchMostActiveUsers() {
      setLoading(true);
      try {
        // Example API call - replace with actual endpoint and query
        const query = new GridifyQueryBuilder().addCondition("playCount", op.GreaterThan, 0).setPageSize(5).build();
        const res = await client.Stats.getUserStats({ days: days as number }, query);
        if (!mounted) return;
        const items =
          res?.data?.map((m: UserStats) => ({
            id: m.id,
            name: m.username,
            value: m.playCount ?? 0,
            icon: IconUser,
            serverId: m.serverId,
          })) || [];
        setMostActiveUsers(items);
      } catch (er: any) {
        console.error("Failed to load most active users", er);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    async function fetchMostConcurrentStreams() {
      setLoading(true);
      try {
        // Example API call - replace with actual endpoint and query
        const query = new GridifyQueryBuilder().addCondition("playCount", op.GreaterThan, 0).setPageSize(5).build();
        const res = await client.Stats.getTranscodeStats({ days: days as number }, query);
        if (!mounted) return;
        const items =
          res?.data?.map((m: TranscodeStats) => ({
            id: m.name,
            name: m.name,
            value: m.playCount ?? 0,
            icon: IconChartBarPopular,
            serverId: "",
          })) || [];
        setMostConcurrentStreams(items);
      } catch (er: any) {
        console.error("Failed to load most concurrent streams", er);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchMostViewedMovies();
    fetchMostPopularMovies();
    fetchMostViewedShows();
    fetchMostPopularShows();
    fetchMostViewedLibraries();
    fetchMostUsedClients();
    fetchMostActiveUsers();
    fetchMostConcurrentStreams();
    return () => {
      mounted = false;
    };
  }, [days]);

  const hasData =
    mostViewedMovies.length > 0 ||
    mostPopularMovies.length > 0 ||
    mostViewedShows.length > 0 ||
    mostPopularShows.length > 0 ||
    mostViewedLibrary.length > 0 ||
    mostUsedClients.length > 0 ||
    mostActiveUsers.length > 0 ||
    mostConcurrentStreams.length > 0;

  return (
    <Group style={{ flexDirection: "column", alignItems: "start", minHeight: 200 }}>
      <Group style={{ width: "100%", justifyContent: "space-between", alignItems: "end" }}>
        <Title order={2}>Watch Statistics</Title>
        <NumberInput
          value={days}
          onChange={(val) => setDays(val ?? 1)}
          min={1}
          max={999}
          step={1}
          hideControls
          styles={{ input: { width: 80 } }}
          placeholder="Days"
          label="Days"
          aria-label="Days to show statistics for"
        />
      </Group>
      {loading && <Loader />}
      {!loading && !hasData && (
        <NotFound title="No Data" message="No watch statistics found for the selected period" enableGoBack={false} />
      )}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg" style={{ width: "100%" }}>
        <WatchStatCard items={mostViewedMovies} title="MOST VIEWED MOVIES" unit="Plays" />
        <WatchStatCard items={mostPopularMovies} title="MOST POPULAR MOVIES" unit="Users" />
        <WatchStatCard items={mostViewedShows} title="MOST VIEWED SHOWS" unit="Plays" />
        <WatchStatCard items={mostPopularShows} title="MOST POPULAR SHOWS" unit="Users" />
        <WatchStatCard items={mostViewedLibrary} title="MOST VIEWED LIBRARIES" unit="Plays" />
        <WatchStatCard items={mostUsedClients} title="MOST USED CLIENTS" unit="Plays" />
        <WatchStatCard items={mostActiveUsers} title="MOST ACTIVE USERS" unit="Plays" />
        <WatchStatCard items={mostConcurrentStreams} title="MOST CONCURRENT STREAMS" unit="Streams" />
      </SimpleGrid>
    </Group>
  );
}
