import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "next-i18next/pages";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";
import { History, Loader2, AlertCircle } from "lucide-react";

import client from "@/lib/api";
import { ItemsWithStats } from "@/lib/models/itemsWithStats";
import ActivityItemCards from "../ActivityItemsCards/ActivityItemCards";
import NotFound from "../ErrorCards/NotFound";
import { Items } from "@/lib/models/items";
import ItemTypes from "@/lib/models/enums/ItemTypes";
import NoData from "../ErrorCards/NoData";

type Props = {
  gridify?: GridifyQueryBuilder;
};

export default function LastWatched({ gridify }: Props) {
  const { t } = useTranslation("common");

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

      query.addOrderBy("DateCreated", true);
      const builtQuery = query.build();

      const res = await client.History.activity.get(builtQuery);
      const activityItems = res?.data ?? [];

      var transformedItems: ItemsWithStats[] = activityItems.map(
        (activity) =>
          ({
            id: activity.item?.id,
            serverId: activity.serverId,
            name: activity.item?.name,
            libraryId: activity.item?.libraryId,
            dateCreated: activity.dateCreated,
            meddiaStreams: activity.item?.mediaStreams,
            duration: activity.item?.duration,
            type: activity.item?.type,
            imageTag: activity.item?.imageTag,
            imageHash: activity.item?.imageHash,
            genres: activity.item?.genres,
            path: activity.item?.path,
            size: activity.item?.size,
            bitrate: activity.item?.bitrate,
            parentId: activity.item?.parentId,
            parentIndex: activity.item?.parentIndex,
            index: activity.item?.index,
            archived: activity.item?.archived ?? false,
            latestActivity: activity,
            latestActivityDate: activity.dateCreated,
            parent: {
              id: activity.item?.type === ItemTypes.Episode ? activity.seriesId : null,
              name: activity.seriesName,
            } as Items,
          }) as ItemsWithStats,
      );

      if (!isCancelledRef.current) setItems(transformedItems);
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
    <div className="flex flex-col items-start w-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <History className="text-brand-purple" size={28} />
        <h2 className="text-2xl font-black text-white tracking-tight">{t("last_watched.title", "Last Watched")}</h2>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="w-full h-40 flex flex-col items-center justify-center">
          <Loader2 size={32} className="text-brand-purple animate-spin" />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="w-full p-4 rounded-xl bg-brand-rose/10 border border-brand-rose/20 flex items-start gap-3">
          <AlertCircle size={18} className="text-brand-rose shrink-0 mt-0.5" />
          <p className="text-sm text-brand-rose/90 font-medium leading-relaxed">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && items.length === 0 && (
        <div className="w-full">
          <NoData
            title={t("last_watched.no_activity_title", "No Activity Found")}
            message={t("last_watched.no_activity_message", "No items in your watch history.")}
          />
        </div>
      )}

      {/* Content */}
      {!loading && !error && items.length > 0 && (
        <div className="w-full">
          <ActivityItemCards items={items} />
        </div>
      )}
    </div>
  );
}
