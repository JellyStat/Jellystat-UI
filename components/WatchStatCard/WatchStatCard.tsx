import React from "react";
import { Card, Title, Group, Text, Avatar, Stack, Container, Image, BackgroundImage } from "@mantine/core";
import ItemTypes from "@/lib/models/enums/ItemTypes";
import { API_BASE } from "@/lib/api";
import { Icon, IconPhoto } from "@tabler/icons-react";

export type WatchStatItem = {
  id: string | number;
  name: string;
  type?: ItemTypes | string;
  value: number;
  imageTag?: string | null;
  icon?: Icon | null;
  serverId: string;
};

export interface WatchStatCardProps {
  title?: string;
  unit?: string;
  items: WatchStatItem[];
  maxItems?: number;
}

export default function WatchStatCard({ title = "Most Viewed", unit = "Plays", items = [], maxItems = 5 }: WatchStatCardProps) {
  const display = items.slice(0, maxItems);
  if (items.length === 0) {
    return null;
  }
  const topItem = display[0];
  const imageUrl = `${API_BASE}Proxy/Images/Items/Primary?Id=${encodeURIComponent(topItem.id)}&Width=600&ServerId=${encodeURIComponent(topItem.serverId)}`;
  const backgroundImage = `${API_BASE}Proxy/Images/Items/Backdrop?Id=${encodeURIComponent(topItem.id)}&Width=300&Quality=80&ServerId=${encodeURIComponent(topItem.serverId)}`;
  const Icon = topItem.icon ?? IconPhoto;
  return (
    <BackgroundImage
      src={backgroundImage}
      radius="md"
      style={{
        backdropFilter: "blur(10px)",
      }}
    >
      <Card
        orientation="horizontal"
        style={{
          height: 180,
          width: "100%",
          maxWidth: 700,

          backdropFilter: "blur(10px)",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        }}
      >
        <Card.Section style={{ width: 120 }}>
          {topItem.imageTag ? (
            <Image
              src={imageUrl}
              alt={topItem.name}
              style={{
                height: 180,
                width: 120,
                objectFit: "contain",
                transition: "opacity 200ms ease",
                borderTopLeftRadius: 8,
                borderBottomLeftRadius: 8,
                overflow: "hidden",
              }}
            />
          ) : (
            <div
              style={{
                height: 180,
                width: 120,
                borderRadius: 8,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon size={64} />
            </div>
          )}
        </Card.Section>
        <Card.Section p={8} style={{ width: "100%", minWidth: 350 }}>
          <Group align="center" justify="space-between" style={{ marginBottom: 4 }}>
            <Title order={4}>{title}</Title>
            <Text size="sm" color="blue">
              {unit}
            </Text>
          </Group>

          <Stack style={{ gap: 2 }}>
            {display.map((it, idx) => (
              <Group key={it.id} align="center" justify="space-between" style={{ width: "100%" }}>
                <Group align="center" style={{ gap: 8 }}>
                  <Text color="dimmed" style={{ fontSize: 12 }}>
                    {idx + 1}
                  </Text>

                  <Text style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.name}</Text>
                </Group>

                <Text style={{ fontWeight: 600, color: "var(--mantine-primary-color-4)" }}>{it.value}</Text>
              </Group>
            ))}
          </Stack>
        </Card.Section>
      </Card>
    </BackgroundImage>
  );
}
