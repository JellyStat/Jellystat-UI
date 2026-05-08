import React from "react";
import ItemCard from "./ItemCard";
import type ItemsWithParentData from "../../lib/models/itemsWithParentData";

export { default as ItemCard } from "./ItemCard";

type Props = {
  items: ItemsWithParentData[];
  cardWidth?: number | string;
  onItemClick?: (item: ItemsWithParentData) => void;
  className?: string;
};

export const ItemCards: React.FC<Props> = ({ items, cardWidth = 160, onItemClick, className }) => {
  return (
    <div
      className={className}
      style={{
        display: "flex",
        gap: 12,
        overflowX: "auto",
        padding: 8,
        WebkitOverflowScrolling: "touch",
        alignItems: "stretch",
      }}
    >
      {items.map((it) => (
        <div key={`${it.serverId || ""}-${it.id}`} style={{ flex: "0 0 auto", display: "flex", alignItems: "stretch" }}>
          <ItemCard item={it} width={cardWidth} onClick={() => onItemClick?.(it)} />
        </div>
      ))}
    </div>
  );
};

export default ItemCards;
