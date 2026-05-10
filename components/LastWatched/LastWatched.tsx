import React, { useEffect, useState, useRef } from "react";
import type { IGridifyQuery } from "gridify-client";
import client from "@/lib/api";
import { ItemsWithStats } from "@/lib/models/itemsWithStats";
import ActivityItemCards from "../ActivityItemsCards/ActivityItemCards";

type Props = {
  gridify?: IGridifyQuery;
  cardWidth?: number | string;
  className?: string;
};

const LastWatched: React.FC<Props> = ({ gridify, cardWidth, className }) => {
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

  const handleRefresh = () => {
    isCancelledRef.current = false;
    fetchItems();
  };

  return (
    <div className={className}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>Last Watched</h2>
        <button onClick={handleRefresh} disabled={loading} style={{ marginLeft: 8 }}>
          Refresh
        </button>
      </div>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: "var(--mantine-color-red, red)" }}>{error}</div>}
      {!loading && !error && <ActivityItemCards items={items} cardWidth={cardWidth} />}
    </div>
  );
};

export default LastWatched;
