import React from "react";
import ItemCard from "./ItemCard";
import type ItemsWithParentData from "@/lib/models/itemsWithParentData";

export { default as ItemCard } from "./ItemCard";

type Props = {
  items: ItemsWithParentData[];
  cardWidth?: number | string;
  className?: string;
};

export const ItemCards: React.FC<Props> = ({ items, cardWidth = 160, className }) => {
  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexWrap: "nowrap",
        gap: 12,
        overflowX: "auto",
        padding: 8,
        WebkitOverflowScrolling: "touch",
        alignItems: "stretch",
        maxWidth: "100%",
        boxSizing: "border-box",
      }}
    >
      {items.map((it) => (
        <div
          key={`${it.serverId || ""}-${it.id}`}
          style={{ flex: "0 0 auto", display: "flex", alignItems: "stretch", boxSizing: "border-box" }}
        >
          <ItemCard item={it} width={cardWidth} />
        </div>
      ))}
    </div>
  );
};

export default ItemCards;
