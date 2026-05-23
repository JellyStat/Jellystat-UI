import React from "react";
import { Card, Text, Container } from "@mantine/core";
import { API_BASE } from "@/lib/api";
import { ItemsWithStats } from "@/lib/models/itemsWithStats";
import { useRouter } from "next/router";
import ItemImage from "../ItemImage/ItemImage";

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
  const differenceString = difference?.formatTimeDifference();

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
          router.push(`/libraries/items/${encodeURIComponent(item.id)}`);
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
