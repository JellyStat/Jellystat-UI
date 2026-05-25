import React, { useState } from "react";
import { useRouter } from "next/router";
import { Card, Text, Group, Stack, Badge, Center, Switch } from "@mantine/core";
import type { LibrariesWithStats } from "@/lib/models/librariesWithStats";
import { API_BASE } from "@/lib/api";
import { IconPhoto } from "@tabler/icons-react";
import LibraryTypeIcons from "@/lib/declarations/libraryIcons";
import { TrackedLibraries } from "@/lib/models/trackedLibraries";

export default function LibraryTrackingCard({
  lib,
  toggleLibraryTracking,
}: {
  lib: TrackedLibraries;
  toggleLibraryTracking: (libraryId: string, tracked: boolean) => void;
}) {
  const router = useRouter();
  // Construct a direct proxy image URL (no blob usage). The API proxy endpoint
  // is `/Proxy/Images/Items/Primary` and accepts Id, Width, Quality, Blur, ServerId.
  const imgUrl = new URL(
    `/Proxy/Images/Items/Primary?Id=${encodeURIComponent(lib.id)}&Width=600&Quality=90&Blur=0&ServerId=${encodeURIComponent(
      lib.serverId,
    )}`,
    API_BASE,
  ).toString();

  const [imageError, setImageError] = useState(false);

  return (
    <Card p={0} shadow="sm" padding="md" radius="md" withBorder style={{ minHeight: 220 }}>
      {imgUrl && !imageError ? (
        <div
          style={{ height: 240, borderRadius: 6, overflow: "hidden", marginBottom: 8, cursor: "pointer" }}
          onClick={() => router.push(`/libraries/${encodeURIComponent(lib.id)}`)}
        >
          <img
            src={imgUrl}
            alt={lib.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={() => setImageError(true)}
            onLoad={() => setImageError(false)}
          />
        </div>
      ) : (
        <div
          style={{ height: 240, borderRadius: 6, background: "#2b2b2b", marginBottom: 8, cursor: "pointer" }}
          onClick={() => router.push(`/libraries/${encodeURIComponent(lib.id)}`)}
        >
          <Center style={{ height: "100%" }}>
            {(() => {
              const Icon = LibraryTypeIcons[lib.type] ?? IconPhoto;
              return <Icon size={64} color="#555" />;
            })()}
          </Center>
        </div>
      )}

      <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8, flex: "1 1 auto" }}>
        <Group justify="space-between" align="center" mb="xs" style={{ width: "100%" }}>
          <Text size="lg" style={{ fontWeight: 700 }}>
            {lib.name}
          </Text>
          <Badge color="blue" variant="dot">
            {lib.type}
          </Badge>
        </Group>

        <Stack style={{ marginTop: 8 }}>
          <Group justify="space-between">
            <Text>Tracked</Text>
            <Switch
              checked={lib.tracked}
              onChange={(event) => {
                toggleLibraryTracking(lib.id, event.currentTarget.checked);
              }}
            />
          </Group>
        </Stack>
      </div>
    </Card>
  );
}
