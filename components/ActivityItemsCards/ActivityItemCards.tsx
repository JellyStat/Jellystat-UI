import React from "react";
import ActivityItemCard from "./ActivityItemCard";
import { ItemsWithStats } from "@/lib/models/itemsWithStats";

type Props = {
  items: ItemsWithStats[];
};

export const ActivityItemCards: React.FC<Props> = ({ items }) => {
  return (
    <div className="flex flex-nowrap items-stretch justify-start gap-4 overflow-x-auto custom-scrollbar pb-4 w-full snap-x">
      {items.map((it) => (
        <div
          key={`${it.serverId || ""}-${it.id}`}
          className="flex-none flex items-stretch snap-start"
        >
          <ActivityItemCard item={it} />
        </div>
      ))}
    </div>
  );
};

export default ActivityItemCards;