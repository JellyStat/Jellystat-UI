import { ActionIcon, Badge, Box, Card, Group, SimpleGrid, Text, Title } from "@mantine/core";
import { useCallback, useEffect, useState } from "react";
import { DataTable } from "mantine-datatable";
import configManager from "../../../lib/configManager";
import { TaskSettings } from "../../../lib/models/taskSettings";
import { IconPlayerPlay, IconRun } from "@tabler/icons-react";
import client from "../../../lib/api";
import WebSocketMessageTypes from "../../../lib/models/enums/WebSocketMessageTypes";
import { WebsocketMessage } from "../../../lib/models/WebsocketMessage";
import wsClient from "../../../lib/wsClient";
import { TaskQueueUpdate } from "../../../lib/models/taskQueueUpdate";
import { TrackedLibraries } from "@/lib/models/trackedLibraries";
import { GridifyQueryBuilder } from "gridify-client";
import LibraryTrackingCard from "@/components/LibraryCard/LibraryTrackingCard";

const taskOptions = [
  { value: 60, label: "1 Hour" },
  { value: 1440, label: "1 Day" },
  { value: 720, label: "12 Hours" },
];

export default function LibrarySettingsPage() {
  const [libraryData, setLibraryData] = useState<TrackedLibraries[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleLibraryTracking(libraryId: string, tracked: boolean) {
    const payload = libraryData.find((u) => u.id === libraryId);

    if (!payload) return;
    payload.tracked = tracked;
    setLibraryData((prev) =>
      prev.map((u) => {
        if (u.id === libraryId) {
          return payload;
        }
        return u;
      }),
    );

    client.Api.trackedLibraries.post([payload!]).catch((err) => {
      // Revert optimistic update
      setLibraryData((prev) =>
        prev.map((u) => {
          if (u.id === libraryId) {
            return { ...u, tracked: !tracked };
          }
          return u;
        }),
      );
    });
  }

  const fetchPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query: GridifyQueryBuilder = new GridifyQueryBuilder();
      // query.setPage(pageToLoad);

      const builtQuery = query.build();

      const res = await client.Api.trackedLibraries.get(builtQuery);
      const data = res?.data ?? [];
      const count = res?.count ?? 0;

      setLibraryData(data);
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      console.error(err);
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  return (
    <div style={{ padding: 20 }}>
      <Group justify="space-between">
        <Title order={2}>Library Settings</Title>
      </Group>
      {error && <Text color="red">Error loading libraries: {error}</Text>}

      {!loading && !error && (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg">
          {libraryData.map((l) => (
            <LibraryTrackingCard key={`${l.serverId}-${l.id}`} lib={l} toggleLibraryTracking={toggleLibraryTracking} />
          ))}
        </SimpleGrid>
      )}
    </div>
  );
}
