import React from "react";
import ItemCard from "./ItemCard";
import type { RecentlyAdded } from "@/lib/models/RecentlyAdded";

type Props = {
  items: RecentlyAdded[];
};

export default function ItemCards({ items }: Props) {
  return (
    <div className="flex flex-nowrap gap-4 overflow-x-auto custom-scrollbar pb-4 -mx-2 px-2 snap-x snap-mandatory items-stretch">
      {items.map((it) => (
        <div key={`${it.serverId || ""}-${it.id}`} className="flex-none flex items-stretch snap-start">
          <ItemCard item={it} />
        </div>
      ))}
    </div>
  );
}
