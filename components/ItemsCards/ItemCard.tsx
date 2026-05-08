import React from "react";
import { Card, Text, Badge } from "@mantine/core";
import type { ItemsWithParentData } from "../../lib/models/itemsWithParentData";
import { API_BASE } from "../../lib/api";

type Props = {
  item: ItemsWithParentData;
  width?: number | string;
  onClick?: () => void;
};

export const ItemCard: React.FC<Props> = ({ item, width = 220, onClick }) => {
  const isValidParent = item.parent && item.parent.id && item.parent.id !== item.id;
  const id = isValidParent ? item.parent!.id : item.id;
  const serverId = item.serverId;

  const imageUrl =
    `${API_BASE}Proxy/Images/Items/Primary?Id=${encodeURIComponent(id)}&Width=600` +
    (serverId ? `&ServerId=${encodeURIComponent(serverId)}` : "");

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
        cursor: onClick ? "pointer" : "default",
      }}
      onClick={onClick}
    >
      <div
        style={{
          width: "100%",
          height: 250,
          background: "#222",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "0 0 auto",
        }}
      >
        <img src={imageUrl} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>

      <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8, flex: "1 1 auto" }}>
        <Text size="xs" color="blue" style={{ paddingBottom: 10 }}>
          {item.dateCreated ? new Date(item.dateCreated).toLocaleString(undefined, dateOptions) : ""}
        </Text>

        <Text size="sm" style={{ lineHeight: 1.1, fontWeight: 700 }}>
          {title}
        </Text>

        {isValidParent && (
          <Text size="xs" color="dimmed" style={{ marginTop: 8 }} lineClamp={2}>
            {item.name}
          </Text>
        )}

        {isValidParent && (
          <Text size="xs" color="dimmed" style={{ marginTop: 8 }} lineClamp={2}>
            {indexString}
          </Text>
        )}
      </div>
    </Card>
  );
};

export default ItemCard;
