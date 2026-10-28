import React, { useMemo } from "react";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";
import { ActivityTable } from "@/components/ActivityTable/ActivityTable";
import type { ItemsWithStats } from "@/lib/models/itemsWithStats";

type Props = {
  item: ItemsWithStats | null;
};

export default function ItemActivity({ item }: Props) {
  const itemMediaQuery = useMemo(() => {
    if (!item?.id) return null;

    return new GridifyQueryBuilder()
      .startGroup()
      .addCondition("ItemId", op.Equal, item.id)
      .or()
      .addCondition("SeriesId", op.Equal, item.id)
      .or()
      .addCondition("SeasonId", op.Equal, item.id)
      .endGroup();
  }, [item?.id]);

  if (!item || !itemMediaQuery) return null;

  return (
    <div className="w-full animate-in fade-in duration-500 pt-2">
      <ActivityTable gridify={itemMediaQuery} GroupResults={false} />
    </div>
  );
}
