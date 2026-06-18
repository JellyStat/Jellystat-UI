import React from "react";
import ItemCard from "./ItemCard";
import type ItemsWithParentData from "@/lib/models/itemsWithParentData";

type Props = {
  items: ItemsWithParentData[];
};

export const ItemCards: React.FC<Props> = ({ items }) => {
  return (
    <div 
      className="flex flex-nowrap gap-4 overflow-x-auto custom-scrollbar pb-4 -mx-2 px-2 snap-x snap-mandatory items-stretch"
    >
      {items.map((it) => (
        <div 
          key={`${it.serverId || ""}-${it.id}`} 
          className="flex-none w-[140px] sm:w-[160px] snap-start"
        >
          <ItemCard item={it} />
        </div>
      ))}
    </div>
  );
};

export default ItemCards;