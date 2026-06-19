import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "next-i18next/pages";
import type { IGridifyQuery } from "gridify-client";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";

import client from "@/lib/api";
import type ItemsWithParentData from "@/lib/models/itemsWithParentData";
import ItemCards from "../ItemsCards/ItemCards";
import NoData from "../ErrorCards/NoData";

type Props = {
  gridify?: IGridifyQuery;
  cardWidth?: number | string;
};

const RecentlyAdded: React.FC<Props> = ({ gridify, cardWidth }) => {
  const { t } = useTranslation("common");

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
    <div className="flex flex-col w-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Sparkles size={28} className="text-brand-cyan" />
        <h2 className="text-xl font-black text-gray-200 tracking-tight">{t("recently_added.title", "Recently Added")}</h2>
      </div>

      <div className="relative w-full">
        {loading && (
          <div className="w-full h-72 bg-surface/30 border border-border rounded-2xl flex flex-col items-center justify-center animate-pulse shadow-inner">
            <Loader2 size={32} className="text-brand-cyan animate-spin mb-3" />
            <span className="text-gray-500 font-medium">{t("recently_added.fetching_latest", "Fetching latest media...")}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-brand-rose/10 border border-brand-rose/20 flex items-start gap-3">
            <AlertCircle size={18} className="text-brand-rose shrink-0 mt-0.5" />
            <p className="text-sm text-brand-rose/90 font-medium">{error}</p>
          </div>
        )}

        {!loading && !error && items.length > 0 && <ItemCards items={items} />}

        {!loading && !error && items.length === 0 && (
          <div className="w-full">
            <NoData
              title={t("last_watched.no_activity_title", "No Activity Found")}
              message={t("last_watched.no_activity_message", "No items in your watch history.")}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentlyAdded;
