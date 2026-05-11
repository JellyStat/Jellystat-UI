import { Title, Text, Card } from "@mantine/core";
import type { LibrariesWithStats } from "@/lib/models/librariesWithStats";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";
import RecentlyAdded from "@/components/RecentlyAdded/RecentlyAdded";
import StatsCard from "@/components/StatsCard/StatsCard";
import StatType from "@/lib/models/enums/StatType";
import LastWatched from "@/components/LastWatched/LastWatched";
import ItemTypes from "@/lib/models/enums/ItemTypes";
import { ItemsWithStats } from "@/lib/models/itemsWithStats";

type Props = {
  item: ItemsWithStats | null;
};

export default function ItemOverview({ item }: Props) {
  if (!item) return null;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginTop: 16 }}>
        <StatsCard type={StatType.Item} id={item?.id ?? ""} />
      </div>

      {/* {item?.type && [ItemTypes.Series, ItemTypes.Season].includes(item!.type!) && (
        <div style={{ marginTop: 20 }}>
          <LastWatched
            gridify={new GridifyQueryBuilder()
              .addCondition("Id", op.Equal, item?.id ?? "")
              .and()
              // .addCondition("Type", op.NotEqual, ItemTypes.Season.toString())
              // .and()
              // .addCondition("Type", op.NotEqual, ItemTypes.Series.toString())
              // .and()
              .addCondition("LatestActivityDate", op.NotEqual, "null")
              .addOrderBy("LatestActivityDate", true)
              .build()}
          />
        </div>
      )} */}
    </div>
  );
}
