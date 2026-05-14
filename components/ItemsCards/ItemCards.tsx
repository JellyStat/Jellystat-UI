import React from "react";
import ItemCard from "./ItemCard";
import type ItemsWithParentData from "@/lib/models/itemsWithParentData";
import { Container } from "@mantine/core";

export { default as ItemCard } from "./ItemCard";

type Props = {
  items: ItemsWithParentData[];
  cardWidth?: number | string;
};

export const ItemCards: React.FC<Props> = ({ items, cardWidth = 160 }) => {
  return (
    <Container
      fluid
      p={0}
      m={0}
      display={"flex"}
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
          display={"flex"}
          flex={"0 0 auto"}
          p={0}
          style={{ alignItems: "stretch", boxSizing: "border-box" }}
        >
          <ItemCard item={it} width={cardWidth} />
        </Container>
      ))}
    </Container>
  );
};

export default ItemCards;
