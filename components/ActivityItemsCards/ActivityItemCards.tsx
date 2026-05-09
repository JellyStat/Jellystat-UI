import React from "react";
import ActivityItemCard from "./ActivityItemCard";
import { ItemsWithStats } from "@/lib/models/itemsWithStats";

type Props = {
  items: ItemsWithStats[];
  cardWidth?: number | string;
  onItemClick?: (item: ItemsWithStats) => void;
  className?: string;
};

export const ActivityItemCards: React.FC<Props> = ({ items, cardWidth = 160, onItemClick, className }) => {
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
          <ActivityItemCard item={it} width={cardWidth} onClick={() => onItemClick?.(it)} />
        </div>
      ))}
    </div>
  );
};

export default ActivityItemCards;
