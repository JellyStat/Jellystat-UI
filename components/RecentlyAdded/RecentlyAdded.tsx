import React, { useEffect, useState, useRef } from "react";
import type { IGridifyQuery } from "gridify-client";
import ItemCards from "../ItemsCards/ItemCards";
import client from "@/lib/api";
import type ItemsWithParentData from "@/lib/models/itemsWithParentData";
import { Group, Loader, Text, Title } from "@mantine/core";

type Props = {
  gridify?: IGridifyQuery;
  cardWidth?: number | string;
};

const RecentlyAdded: React.FC<Props> = ({ gridify, cardWidth }) => {
  const [items, setItems] = useState<ItemsWithParentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isCancelledRef = useRef(false);

  const fetchItems = async () => {
    isCancelledRef.current = false;
    setLoading(true);
    setError(null);
    try {
      const res = await client.Api.getRecentlyAdded(gridify);
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
      <Title order={2}>Recently Added</Title>
      {loading && <Loader />}
      {error && <Text style={{ color: "var(--mantine-color-red, red)" }}>{error}</Text>}
      {!loading && !error && <ItemCards items={items} cardWidth={cardWidth} />}
    </Group>
  );
};

export default RecentlyAdded;
