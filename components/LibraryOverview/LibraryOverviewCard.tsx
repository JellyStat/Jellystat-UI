import React from "react";
import { Card, Title, Group, Text, Avatar, Stack, Container, Image, BackgroundImage } from "@mantine/core";
import ItemTypes from "@/lib/models/enums/ItemTypes";
import { API_BASE } from "@/lib/api";
import { Icon, IconPhoto } from "@tabler/icons-react";
import { LibrariesWithStats, TypeCountModel } from "@/lib/models/librariesWithStats";

export interface WatchStatCardProps {
  title: string;
  libraries: LibrariesWithStats[];
  Icon: Icon;
}

export default function LibraryOverviewCard({ title, libraries, Icon }: WatchStatCardProps) {
  const display = libraries.slice(0, 5);
  if (libraries.length === 0) {
    return null;
  }

  const aggregateTypes = new Set<TypeCountModel["type"]>();
  const excludedTypes = [ItemTypes.Folder, ItemTypes.Unknown];

  libraries.forEach((lib) => {
    if (lib.typeCounts) {
      lib.typeCounts
        .filter((tc) => !excludedTypes.includes(tc.type ?? ItemTypes.Unknown))
        .forEach((tc) => aggregateTypes.add(tc.type));
    }
  });

  const types = Array.from(aggregateTypes);
  const unitString = types.length > 0 ? types.join("/ ") : "Items";

  return (
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
      </Card.Section>
      <Card.Section p={8} style={{ width: "100%", minWidth: 350 }}>
        <Group align="center" justify="space-between" style={{ marginBottom: 4 }}>
          <Title order={4}>{title}</Title>
          <Text size="sm" color="blue">
            {unitString}
          </Text>
        </Group>

        <Stack style={{ gap: 2 }}>
          {display.map((it, idx) => {
            const counts = (it.typeCounts ?? [])
              .filter((t) => t.type !== undefined && types.includes(t.type))
              .map((tc) => tc.count);

            const countString = counts.length > 0 ? counts.join("/ ") : "0";

            return (
              <Group key={it.id} align="center" justify="space-between" style={{ width: "100%" }}>
                <Group align="center" style={{ gap: 8 }}>
                  <Text color="dimmed" style={{ fontSize: 12 }}>
                    {idx + 1}
                  </Text>

                  <Text style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.name}</Text>
                </Group>

                <Text style={{ fontWeight: 600, color: "var(--mantine-primary-color-4)" }}>{countString}</Text>
              </Group>
            );
          })}
        </Stack>
      </Card.Section>
    </Card>
  );
}
