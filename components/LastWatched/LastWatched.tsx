import React, { useEffect, useState, useRef } from "react";
import type { IGridifyQuery } from "gridify-client";
import client from "@/lib/api";
import { ItemsWithStats } from "@/lib/models/itemsWithStats";
import ActivityItemCards from "../ActivityItemsCards/ActivityItemCards";
import { Group, Title } from "@mantine/core";

type Props = {
  gridify?: IGridifyQuery;
  cardWidth?: number | string;
};

const LastWatched: React.FC<Props> = ({ gridify, cardWidth }) => {
  const [items, setItems] = useState<ItemsWithStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isCancelledRef = useRef(false);

  const fetchItems = async () => {
    isCancelledRef.current = false;
    setLoading(true);
    setError(null);
    try {
      const res = await client.Api.getLibraryItems(gridify);
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
    <Group>
      <Title order={2}>Last Watched</Title>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: "var(--mantine-color-red, red)" }}>{error}</div>}
      {!loading && !error && <ActivityItemCards items={items} cardWidth={cardWidth} />}
    </Group>
  );
};

export default LastWatched;
