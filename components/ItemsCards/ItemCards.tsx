import React from "react";
import ItemCard from "./ItemCard.tsx";
import type ItemsWithParentData from "@/lib/models/itemsWithParentData.ts";
import { Container } from "@mantine/core";

export { default as ItemCard } from "./ItemCard.tsx";

type Props = {
  items: ItemsWithParentData[];
};

export const ItemCards: React.FC<Props> = ({ items }) => {
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
          <ItemCard item={it} />
        </Container>
      ))}
    </Container>
  );
};

export default ItemCards;
