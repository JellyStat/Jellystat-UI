import type { LibrariesWithStats } from "@/lib/models/librariesWithStats";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";
import ItemTypes from "@/lib/models/enums/ItemTypes";
import MediaGrid from "@/components/MediaGrid/MediaGrid";
import { useMemo } from "react";
import { ItemsWithStats } from "@/lib/models/itemsWithStats";

type Props = {
  item: ItemsWithStats | null;
};

export default function ItemMedia({ item }: Props) {
  if (!item || ![ItemTypes.Season, ItemTypes.Series].includes(item.type)) return null;

  const itemMediaQuery = useMemo(
    () =>
      new GridifyQueryBuilder()
        .addCondition("ParentId", op.Equal, item.id)
        .and()
        .startGroup()
        .addCondition("Type", op.Equal, ItemTypes.Season.toString())
        .or()
        .addCondition("Type", op.Equal, ItemTypes.Episode.toString())
        .endGroup(),
    [item.id],
  );

  return (
    <div style={{ padding: 20 }}>
      <MediaGrid gridify={itemMediaQuery} />
    </div>
  );
}
