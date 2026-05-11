import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";

import { useMemo } from "react";
import { ActivityTable } from "@/components/ActivityTable/ActivityTable";
import { ItemsWithStats } from "@/lib/models/itemsWithStats";

type Props = {
  item: ItemsWithStats | null;
};

export default function ItemActivity({ item }: Props) {
  if (!item) return null;

  const itemMediaQuery = useMemo(
    () =>
      new GridifyQueryBuilder()
        .startGroup()
        .addCondition("ItemId", op.Equal, item.id)
        .or()
        .addCondition("SeriesId", op.Equal, item.id)
        .or()
        .addCondition("SeasonId", op.Equal, item.id)
        .endGroup(),
    [item.id],
  );

  return (
    <div style={{ padding: 20 }}>
      <ActivityTable gridify={itemMediaQuery} GroupResults={false} />
    </div>
  );
}
