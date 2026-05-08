import React, { useEffect, useState } from "react";
import type { IGridifyQuery } from "gridify-client";
import ItemCards from "../ItemsCards/ItemCards";
import { getRecentlyAdded } from "../../lib/api";
import type ItemsWithParentData from "../../lib/models/itemsWithParentData";

type Props = {
  gridify?: IGridifyQuery;
  cardWidth?: number | string;
  onItemClick?: (item: ItemsWithParentData) => void;
  className?: string;
};

const RecentlyAdded: React.FC<Props> = ({ gridify, cardWidth, onItemClick, className }) => {
  const [items, setItems] = useState<ItemsWithParentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getRecentlyAdded(gridify)
      .then((res) => {
        if (!cancelled) setItems(res?.data ?? []);
      })
      .catch((err: any) => {
        if (!cancelled) setError(err?.message ?? String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [gridify]);

  return (
    <div className={className}>
      <h2>Recently Added</h2>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: "var(--mantine-color-red, red)" }}>{error}</div>}
      {!loading && !error && <ItemCards items={items} cardWidth={cardWidth} onItemClick={onItemClick} />}
    </div>
  );
};

export default RecentlyAdded;
