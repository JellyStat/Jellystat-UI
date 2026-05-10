import React, { useEffect, useState, useRef } from "react";
import type { IGridifyQuery } from "gridify-client";
import ItemCards from "../ItemsCards/ItemCards";
import client from "../../lib/api";
import type ItemsWithParentData from "../../lib/models/itemsWithParentData";

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

  const handleRefresh = () => {
    isCancelledRef.current = false;
    fetchItems();
  };

  return (
    <div
      style={{
        // overflowX: "hidden",
        maxWidth: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>Recently Added</h2>
        <button onClick={handleRefresh} disabled={loading} style={{ marginLeft: 8 }}>
          Refresh
        </button>
      </div>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: "var(--mantine-color-red, red)" }}>{error}</div>}
      {!loading && !error && <ItemCards items={items} cardWidth={cardWidth} />}
    </div>
  );
};

export default RecentlyAdded;
