import { Title, Text, Card } from "@mantine/core";
import type { LibrariesWithStats } from "@/lib/models/librariesWithStats";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";
import RecentlyAdded from "@/components/RecentlyAdded/RecentlyAdded";
import StatsCard from "@/components/StatsCard/StatsCard";
import StatType from "@/lib/models/enums/StatType";
import LastWatched from "@/components/LastWatched/LastWatched";
import ItemTypes from "@/lib/models/enums/ItemTypes";
import { ItemsWithStats } from "@/lib/models/itemsWithStats";
import { useEffect, useMemo, useState } from "react";
import client from "@/lib/api";

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
    </div>
  );
}
