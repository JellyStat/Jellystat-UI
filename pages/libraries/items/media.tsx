import React, { useMemo } from "react";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";
import ItemTypes from "@/lib/models/enums/ItemTypes";
import MediaGrid from "@/components/MediaGrid/MediaGrid";
import type { ItemsWithStats } from "@/lib/models/itemsWithStats";

type Props = {
  item: ItemsWithStats | null;
};

export default function ItemMedia({ item }: Props) {
  const itemMediaQuery = useMemo(() => {
    if (!item?.id) return null;

    return new GridifyQueryBuilder()
      .addCondition("ParentId", op.Equal, item.id)
      .and()
      .startGroup()
      .addCondition("Type", op.Equal, ItemTypes.Season.toString())
      .or()
      .addCondition("Type", op.Equal, ItemTypes.Episode.toString())
      .endGroup();
  }, [item?.id]);

  if (!item || !itemMediaQuery || ![ItemTypes.Season, ItemTypes.Series].includes(item.type)) {
    return null;
  }

  return (
    <div className="w-full animate-in fade-in duration-500 pt-2">
      <MediaGrid 
        gridify={itemMediaQuery} 
        defaultOrderBy="index" 
        defaultOrderDesc={false} 
        showSort={false} 
      />
    </div>
  );
}