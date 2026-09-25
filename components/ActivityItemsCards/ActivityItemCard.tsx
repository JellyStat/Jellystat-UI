import React from "react";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { Clock, User } from "lucide-react";

import { API_BASE } from "@/lib/api";
import { ItemsWithStats } from "@/lib/models/itemsWithStats";
import ItemImage from "../ItemImage/ItemImage";

type Props = {
  item: ItemsWithStats;
  width?: number | string;
  height?: number | string;
};

export const ActivityItemCard: React.FC<Props> = ({ item, width = 160, height = 240 }) => {
  const router = useRouter();
  const { t } = useTranslation("common");

  const imageId = item.parent?.id ?? item.id;
  const serverId = item.serverId;

  // Build the image URL safely
  const imageUrl = `${API_BASE}/Proxy/Images/Items/Primary?Id=${encodeURIComponent(imageId)}&Width=600&ServerId=${encodeURIComponent(serverId || "")}`;

  // Formatting strings
  const isValidParent = item.parent && item.parent.id && item.parent.id !== item.id;
  const indexString = item.parentIndex != null ? `S${item.parentIndex} - E${item.index}` : "";
  const title = item.parent?.name ?? item.name;

  const difference = item.latestActivity?.dateCreated ? Date.now() - new Date(item.latestActivity.dateCreated).getTime() : null;
  const differenceString = difference?.formatTimeDifference?.() || "";

  return (
    <div
      className="bg-surface/60 backdrop-blur-md border border-border rounded-2xl overflow-hidden flex flex-col group transition-all duration-300 hover:border-brand-purple/50 shadow-lg hover:shadow-brand-purple/10"
      style={{ width }}
    >
      {/* Image Container */}
      <div className="shrink-0 overflow-hidden bg-background/50" style={{ height }}>
        <ItemImage
          imageUrl={imageUrl}
          imageHash={item.imageHash}
          archived={item.archived}
          width="100%"
          height="100%"
          borderRadius={[16, 16, 0, 0]}
          onClick={() => router.push(`/libraries/items/${encodeURIComponent(item.id)}`)}
        />
      </div>

      {/* Metadata Container */}
      <div className="p-3.5 flex flex-col flex-1 w-full gap-1.5 bg-linear-to-b from-transparent to-background/30">
        {/* Meta Row: Timestamp & User */}
        <div className="flex flex-col items-start gap-2 mb-1">
          {differenceString && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-brand-purple uppercase tracking-wider">
              <Clock size={10} />
              {differenceString}
            </span>
          )}

          <span className="flex items-center gap-1 text-[12px] font-bold text-gray-400 bg-background/80 rounded border border-border/50 truncate max-w-[80px] shadow-inner">
            <User size={12} className="shrink-0" />
            <span
              className="truncate hover:text-brand-purple transition-colors cursor-pointer"
              onClick={() => router.push(`/users/${encodeURIComponent(item.latestActivity?.userId ?? "")}`)}
            >
              {item.latestActivity?.userName ?? t("common.na", "N/A")}
            </span>
          </span>
        </div>

        {/* Title */}
        <h4
          className="text-sm font-black text-gray-200 leading-tight line-clamp-2 hover:text-brand-purple transition-colors cursor-pointer"
          onClick={() => router.push(`/libraries/items/${encodeURIComponent(item.parent?.id ?? "")}`)}
        >
          {title}
        </h4>

        {/* Subtitle (Episode Name) */}
        {isValidParent && (
          <p
            className="text-xs text-gray-300 line-clamp-1 cursor-pointer hover:text-brand-purple transition-colors"
            onClick={() => router.push(`/libraries/items/${encodeURIComponent(item.id ?? "")}`)}
          >
            {item.name}
          </p>
        )}

        {/* Season / Episode Index */}
        {item.parentIndex != null && (
          <p className="text-[11px] text-gray-400 tracking-wider uppercase mt-auto pt-1">{indexString}</p>
        )}
      </div>
    </div>
  );
};

export default ActivityItemCard;
