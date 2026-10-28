import React from "react";
import { API_BASE } from "@/lib/api";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import type { RecentlyAdded } from "@/lib/models/RecentlyAdded";
import { HardDrive } from "lucide-react";
import ItemImage from "../ItemImage/ItemImage";

type Props = {
  item: RecentlyAdded;
  width?: number | string;
  height?: number | string;
  /** Overlay the item's on-disk size (series/seasons are rolled up from episodes by the sync task). */
  showSize?: boolean;
};

export default function ItemCard({ item, width = 160, height = 240, showSize = false }: Props) {
  const router = useRouter();
  const { t, i18n } = useTranslation("common");

  const isValidParent = item.parent && item.parent.id && item.parent.id !== item.id;
  const hasGroupedItems = item.grouped && item.grouped.length > 0;
  const id = isValidParent ? item.parent!.id : item.id;
  const serverId = item.serverId;
  const imageUrl = `${API_BASE}/Proxy/Images/Items/Primary?Id=${encodeURIComponent(id)}&Width=400&ServerId=${encodeURIComponent(serverId)}`;

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
  const episodeCount = item.grouped?.length ?? 0;
  const episodesLabel = t("item.episodes", "{{episodeCount}} Episodes", { episodeCount });
  const sizeLabel = showSize && item.size ? item.size.formatBytes() : null;
  const fluid = typeof width === "string";

  return (
    <div
      className="bg-surface/60 backdrop-blur-md border border-border rounded-2xl overflow-hidden flex flex-col h-full group transition-all duration-300 hover:border-brand-purple/50 shadow-lg hover:shadow-brand-purple/10"
      style={{ width }}
    >
      {/* Image Container */}
      {/* Fixed-width cards use the explicit height; fluid (grid) cards keep the 2:3 poster ratio. */}
      <div
        className={`relative shrink-0 overflow-hidden bg-background/50 ${fluid ? "w-full aspect-2/3" : ""}`}
        style={fluid ? undefined : { height }}
      >
        <ItemImage
          imageUrl={imageUrl}
          imageHash={item.imageHash}
          archived={item.archived}
          width="100%"
          height="100%"
          borderRadius={[16, 16, 0, 0]}
          onClick={() => router.push(`/libraries/items/${encodeURIComponent(item.id)}`)}
        />

        {/* Size Badge (ported from v1's .size-tag) */}
        {sizeLabel && (
          <div
            className="pointer-events-none absolute bottom-2 right-2 z-30 flex items-center gap-1 rounded-md border border-brand-purple/40 bg-black/70 px-1.5 py-0.5 shadow-lg backdrop-blur-md"
            title={t("media_grid.sort_size", "Size")}
          >
            <HardDrive size={10} className="text-brand-purple" />
            <span className="text-xs font-bold tabular-nums tracking-wide text-gray-100">{sizeLabel}</span>
          </div>
        )}
      </div>

      {/* Metadata Container */}
      <div className="p-3.5 flex flex-col flex-1 w-full gap-1.5 bg-linear-to-b from-transparent to-background/30">
        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-cyan mb-1 truncate">{formattedDate}</span>

        <h4
          className="text-sm font-black text-gray-200 leading-tight line-clamp-2 hover:text-brand-purple transition-colors cursor-pointer"
          onClick={() => router.push(`/libraries/items/${encodeURIComponent(item.parent?.id ?? item.id ?? "")}`)}
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
        {hasGroupedItems && <p className="text-[11px] text-gray-400 tracking-wider uppercase mt-auto pt-1">{episodesLabel}</p>}
      </div>
    </div>
  );
}
