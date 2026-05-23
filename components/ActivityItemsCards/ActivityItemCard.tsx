import React from "react";
import { Card, Text, Container } from "@mantine/core";
import { API_BASE } from "@/lib/api.ts";
import { ItemsWithStats } from "@/lib/models/itemsWithStats.ts";
import { useRouter } from "next/router";
import ItemImage from "../ItemImage/ItemImage.tsx";

type Props = {
  item: ItemsWithStats;
  width?: number | string;
  height?: number | string;
};

export const ActivityItemCard: React.FC<Props> = ({ item, width = 160, height = 240 }) => {
  const imageId = item.parent?.id ?? item.id;
  const serverId = item.serverId;
  const router = useRouter();

  const imageUrl = `${API_BASE}Proxy/Images/Items/Primary?Id=${encodeURIComponent(imageId)}&Width=600&ServerId=${encodeURIComponent(serverId)}`;

  const isValidParent = item.parent && item.parent.id && item.parent.id !== item.id;
  const indexString = item.parentIndex != null ? `S${item.parentIndex} - E${item.index}` : "";
  const title = item.parent?.name ?? item.name;
  const difference = item.latestActivity?.dateCreated ? Date.now() - new Date(item.latestActivity.dateCreated).getTime() : null;
  const differenceString = formatTime(difference);

  function formatTime(time: number | null) {
    if (time === null) return "Unknown";

    // time is milliseconds difference (Date.now() - pastDate)
    const totalSeconds = Math.floor(Math.abs(time) / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) return `${days} ${days > 1 ? "Days" : "Day"} Ago`;
    if (hours > 0) return `${hours} ${hours > 1 ? "Hours" : "Hour"} Ago`;
    if (minutes > 0) return `${minutes} ${minutes > 1 ? "Minutes" : "Minute"} Ago`;
    return `${seconds} ${seconds > 1 ? "Seconds" : "Second"} Ago`;
  }

  return (
    <Card
      shadow="sm"
      p={0}
      style={{
        width,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <ItemImage
        imageUrl={imageUrl}
        imageHash={item.imageHash}
        archived={item.archived}
        width={width}
        height={height}
        onClick={() => {
          router.push(`/items/${encodeURIComponent(item.id)}`);
        }}
      />

      <Container p={10} display="flex" flex="1 1 auto" w="100%" style={{ flexDirection: "column", gap: 8 }}>
        <Text size="xs" style={{ color: "var(--mantine-primary-color-4)" }}>
          {item.latestActivity?.dateCreated ? differenceString : ""}
        </Text>

        <Text size="sm" style={{ paddingBottom: 5, lineHeight: 1.1, fontWeight: 700 }}>
          {item.latestActivity?.userName ?? "N/A"}
        </Text>

        <Text size="sm" style={{ lineHeight: 1.1, fontWeight: 700 }}>
          {title}
        </Text>

        {isValidParent && (
          <Text size="xs" color="dimmed" lineClamp={2}>
            {item.name}
          </Text>
        )}

        {item.parentIndex && (
          <Text size="xs" color="dimmed" style={{ marginTop: 8 }} lineClamp={2}>
            {indexString}
          </Text>
        )}
      </Container>
    </Card>
  );
};

export default ActivityItemCard;
