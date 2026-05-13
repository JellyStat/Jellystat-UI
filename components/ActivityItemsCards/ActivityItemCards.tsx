import React from "react";
import ActivityItemCard from "./ActivityItemCard";
import { ItemsWithStats } from "@/lib/models/itemsWithStats";
import { Container } from "@mantine/core";

type Props = {
  items: ItemsWithStats[];
  cardWidth?: number | string;
};

export const ActivityItemCards: React.FC<Props> = ({ items, cardWidth = 160 }) => {
  return (
    <Container
      maw={"100%"}
      display={"flex"}
      p={0}
      style={{
        flexWrap: "nowrap",
        gap: 12,
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        alignItems: "stretch",
        boxSizing: "border-box",
      }}
    >
      {items.map((it) => (
        <Container
          key={`${it.serverId || ""}-${it.id}`}
          display={"flex"}
          flex={"0 0 auto"}
          p={0}
          style={{ alignItems: "stretch", boxSizing: "border-box" }}
        >
          <ActivityItemCard item={it} width={cardWidth} />
        </Container>
      ))}
    </Container>
  );
};

export default ActivityItemCards;
