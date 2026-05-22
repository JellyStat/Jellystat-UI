import React, { useEffect, useState, useRef } from "react";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";
import client from "@/lib/api";
import { ItemsWithStats } from "@/lib/models/itemsWithStats";
import ActivityItemCards from "../ActivityItemsCards/ActivityItemCards";
import { Group, Loader, Text, Title } from "@mantine/core";
import NotFound from "../ErrorCards/NotFound";

type Props = {
  gridify?: GridifyQueryBuilder;
};

const LastWatched: React.FC<Props> = ({ gridify }) => {
  const [items, setItems] = useState<ItemsWithStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isCancelledRef = useRef(false);

  const fetchItems = async () => {
    isCancelledRef.current = false;
    setLoading(true);
    setError(null);
    try {
      const query: GridifyQueryBuilder = gridify ? new GridifyQueryBuilder({ from: gridify }) : new GridifyQueryBuilder();
      query.and().addCondition("latestActivity ", op.NotEqual, "null").addOrderBy("LatestActivityDate", true);
      const builtQuery = query.build();
      const res = await client.Api.getLibraryItems(builtQuery);
      if (!isCancelledRef.current) setItems(res?.data ?? []);
    } catch (err: any) {
      if (!isCancelledRef.current) setError(err?.message ?? String(err));
    } finally {
      if (!isCancelledRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    isCancelledRef.current = false;
    fetchItems();
    return () => {
      isCancelledRef.current = true;
    };
  }, [gridify]);

  return (
    <Group style={{ flexDirection: "column", alignItems: "start" }}>
      <Title order={2}>Last Watched</Title>
      {loading && <Loader />}
      {error && <Text style={{ color: "var(--mantine-color-red, red)" }}>{error}</Text>}
      {!loading && !error && items.length === 0 && (
        <NotFound title="No Activity Found" message="No items in your watch history" enableGoBack={false} />
      )}
      {!loading && !error && items.length > 0 && <ActivityItemCards items={items} />}
    </Group>
  );
};

export default LastWatched;
