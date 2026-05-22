import React from "react";
import ActivityItemCard from "./ActivityItemCard.tsx";
import { ItemsWithStats } from "@/lib/models/itemsWithStats.ts";
import { Container } from "@mantine/core";

type Props = {
  items: ItemsWithStats[];
};

export const ActivityItemCards: React.FC<Props> = ({ items }) => {
  return (
    <Container
      fluid
      p={0}
      m={0}
      display="flex"
      style={{
        flexWrap: "nowrap",
        gap: 12,
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        alignItems: "stretch",
        justifyContent: "flex-start",
        boxSizing: "border-box",
      }}
    >
      {items.map((it) => (
        <Container
          key={`${it.serverId || ""}-${it.id}`}
          display="flex"
          flex="0 0 auto"
          p={0}
          style={{ alignItems: "stretch", boxSizing: "border-box" }}
        >
          <ActivityItemCard item={it} />
        </Container>
      ))}
    </Container>
  );
};

export default ActivityItemCards;
