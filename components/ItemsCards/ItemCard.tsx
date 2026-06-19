import React from "react";
import { API_BASE } from "@/lib/api";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { ItemsWithStats } from "@/lib/models/itemsWithStats";
import ItemImage from "../ItemImage/ItemImage";

type Props = {
  item: ItemsWithStats;
  width?: number | string;
  height?: number | string;
};

export const ItemCard: React.FC<Props> = ({ item, width = 160, height = 240 }) => {
  const router = useRouter();
  const { t, i18n } = useTranslation("common");

  const isValidParent = item.parent && item.parent.id && item.parent.id !== item.id;
  const id = isValidParent ? item.parent!.id : item.id;
  const serverId = item.serverId;
  const imageUrl = `${API_BASE}Proxy/Images/Items/Primary?Id=${encodeURIComponent(id)}&Width=400&ServerId=${encodeURIComponent(serverId)}`;

  // Formatting
  const indexString =
    item.parentIndex != null
      ? `S${item.parentIndex.toString().padStart(2, "0")} - E${item.index?.toString().padStart(2, "0")}`
      : "";
  const title = isValidParent ? item.parent!.name : item.name;
  const formattedDate = item.dateCreated
    ? new Date(item.dateCreated).toLocaleDateString(i18n.language || undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

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
        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-cyan mb-1 truncate">{formattedDate}</span>

        <h4
          className="text-sm font-black text-gray-200 leading-tight line-clamp-2 hover:text-brand-purple transition-colors cursor-pointer"
          onClick={() => router.push(`/libraries/items/${encodeURIComponent(item.parent?.id ?? "")}`)}
        >
          {title}
        </h4>

        {isValidParent && (
          <p
            className="text-xs text-gray-300 line-clamp-1 cursor-pointer hover:text-brand-purple transition-colors"
            onClick={() => router.push(`/libraries/items/${encodeURIComponent(item.id ?? "")}`)}
          >
            {item.name}
          </p>
        )}
        {isValidParent && <p className="text-[11px] text-gray-400 tracking-wider uppercase mt-auto pt-1">{indexString}</p>}
      </div>
    </div>
  );
};

export default ItemCard;
