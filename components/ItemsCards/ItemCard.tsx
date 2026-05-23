import React from "react";
import { Card, Text, Container } from "@mantine/core";
import { API_BASE } from "@/lib/api";
import { useRouter } from "next/router";
import { ItemsWithStats } from "@/lib/models/itemsWithStats";
import ItemImage from "../ItemImage/ItemImage";

type Props = {
  item: ItemsWithStats;
  width?: number | string;
  height?: number | string;
};

export const ItemCard: React.FC<Props> = ({ item, width = 160, height = 240 }) => {
  const router = useRouter();
  const isValidParent = item.parent && item.parent.id && item.parent.id !== item.id;
  const id = isValidParent ? item.parent!.id : item.id;
  const serverId = item.serverId;

  const imageUrl = `${API_BASE}Proxy/Images/Items/Primary?Id=${encodeURIComponent(id)}&Width=600&ServerId=${encodeURIComponent(serverId)}`;

  const indexString = item.parentIndex != null ? `S${item.parentIndex} - E${item.index}` : "";
  const title = isValidParent ? item.parent!.name : item.name;
  const twelve_hr = typeof window !== "undefined" ? new Intl.DateTimeFormat().resolvedOptions().hour12 : false;
  const dateOptions: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: twelve_hr,
  };

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
        <Text size="xs" color="primary" style={{ paddingBottom: 10, color: "var(--mantine-primary-color-4)" }}>
          {item.dateCreated ? new Date(item.dateCreated).toLocaleString(undefined, dateOptions) : ""}
        </Text>

        <Text size="sm" style={{ lineHeight: 1.1, fontWeight: 700 }}>
          {title}
        </Text>

        {isValidParent && (
          <Text size="xs" color="dimmed" lineClamp={2}>
            {item.name}
          </Text>
        )}

        {isValidParent && (
          <Text size="xs" color="dimmed" style={{ marginTop: 8 }} lineClamp={2}>
            {indexString}
          </Text>
        )}
      </Container>
    </Card>
  );
};

export default ItemCard;
