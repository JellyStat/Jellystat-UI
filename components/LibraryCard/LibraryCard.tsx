import React, { useState } from "react";
import { useRouter } from "next/router";
import { Card, Text, Group, Stack, Badge, Center } from "@mantine/core";
import type { LibrariesWithStats } from "../../lib/models/librariesWithStats";
import { API_BASE } from "../../lib/api";
import { IconPhoto } from "@tabler/icons-react";
import LibraryTypeIcons from "@/lib/declarations/libraryIcons";

function formatBytes(bytes?: number | null) {
  if (!bytes || bytes <= 0) return "0.00 KB";
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

export default function LibraryCard({ lib }: { lib: LibrariesWithStats }) {
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
        <div style={{ height: 240, borderRadius: 6, background: "#2b2b2b", marginBottom: 8 }}>
          <Center style={{ height: "100%" }}>
            {(() => {
              const Icon = LibraryTypeIcons[lib.type] ?? IconPhoto;
              return <Icon size={64} color="#555" />;
            })()}
          </Center>
        </div>
      )}

      <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8, flex: "1 1 auto" }}>
        <Group align="center" mb="xs" style={{ width: "100%" }}>
          <Text size="lg" style={{ fontWeight: 700 }}>
            {lib.name}
          </Text>
          <Badge color="blue" variant="dot">
            {lib.type}
          </Badge>
        </Group>

        <Stack style={{ marginTop: 8 }}>
          <Text size="sm" color="dimmed">
            Total Time: {lib.playbackDuration?.ticksToDurationString() ?? "N/A"}
          </Text>

          <Text size="sm" color="dimmed">
            Total Files:{" "}
            {lib.typeCounts
              ?.filter((t) => t.type && !["Season", "Series", "Folder"].includes(t.type))
              .map((t) => t.count!)
              .reduce((a, b) => a + b, 0) ?? "N/A"}
          </Text>
          <Text size="sm" color="dimmed">
            Total Size: {formatBytes(lib.size)}
          </Text>
          <Text size="sm" color="dimmed">
            Play Count: {lib.playCount ?? 0}
          </Text>
          <Text size="sm" color="dimmed">
            Play Duration: {lib.playDuration?.secondsToDurationString() ?? "N/A"}
          </Text>
          <Text size="sm" color="dimmed">
            Last Played: {lib.latestActivity?.seriesName ?? lib.latestActivity?.name ?? "N/A"}
          </Text>
          <Text size="sm" color="dimmed">
            Last Activity: {lib.latestActivity?.dateCreated ? new Date(lib.latestActivity.dateCreated).toLocaleString() : "N/A"}
          </Text>
          {lib.typeCounts && lib.typeCounts.length > 0 && (
            <Group align="center">
              {lib.typeCounts.map((t) => (
                <Badge key={t.type} color="blue" variant="dot">
                  {t.type}: {t.count ?? 0}
                </Badge>
              ))}
            </Group>
          )}
        </Stack>
      </div>
    </Card>
  );
}
