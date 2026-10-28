import React from "react";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { Clock } from "lucide-react";

import { API_BASE } from "@/lib/api";
import LibraryTypeIcons from "@/lib/declarations/libraryIcons";
import type { TimelineEntry } from "@/lib/models/timelineEntry";
import ItemImage from "../ItemImage/ItemImage";
import { isSameDay, splitDuration } from "./helpers";

type Props = {
  entry: TimelineEntry;
  /** Which side of the center line the card sits on (desktop only). */
  side: "left" | "right";
};

export default function ActivityTimelineItem({ entry, side }: Props) {
  const router = useRouter();
  const { t, i18n } = useTranslation("common");

  const locale = i18n.language || undefined;
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });

  const showRange = entry.isSeries && !isSameDay(entry.firstActivityDate, entry.lastActivityDate);
  const dateLabel = showRange
    ? `${formatDate(entry.firstActivityDate)} - ${formatDate(entry.lastActivityDate)}`
    : formatDate(entry.lastActivityDate);

  const seasonLabel = (n: number) => (n === 0 ? t("timeline.specials", "Specials") : t("timeline.season", "Season {{n}}", { n }));
  let seasons: string | null = null;
  if (entry.isSeries && entry.firstSeason != null && entry.lastSeason != null) {
    seasons =
      entry.firstSeason === entry.lastSeason
        ? seasonLabel(entry.firstSeason)
        : t("timeline.season_range", "{{from}} - {{to}}", {
            from: seasonLabel(entry.firstSeason),
            to: seasonLabel(entry.lastSeason),
          });
  }

  const { hours, minutes } = splitDuration(entry.totalPlayDuration);
  const durationLabel =
    hours > 0
      ? t("timeline.watched_hours_minutes", "{{hours}}h {{minutes}}m watched", { hours, minutes })
      : t("timeline.watched_minutes", "{{minutes}}m watched", { minutes });

  const imageUrl = `${API_BASE}/Proxy/Images/Items/Primary?Id=${encodeURIComponent(entry.itemId)}&Width=400&ServerId=${encodeURIComponent(entry.serverId)}`;
  const PlaceholderIcon = LibraryTypeIcons[entry.libraryType] ?? LibraryTypeIcons["Unknown"];
  const goToItem = () => router.push(`/libraries/items/${encodeURIComponent(entry.itemId)}`);

  const textAlign = side === "left" ? "md:text-right md:items-end" : "md:text-left md:items-start";

  return (
    <li className="relative grid grid-cols-[2.5rem_1fr] md:grid-cols-[1fr_3rem_1fr] gap-x-4 md:gap-x-0 items-center py-4">
      {/* Center line + dot */}
      <div className="relative row-start-1 col-start-1 md:col-start-2 flex justify-center self-stretch">
        <div className="absolute inset-y-[-1rem] w-px bg-border" />
        <div className="relative z-10 my-auto w-3 h-3 rounded-full bg-brand-cyan ring-4 ring-background shadow-[0_0_12px_rgba(0,164,220,0.5)]" />
      </div>

      {/* Card */}
      <div
        className={`row-start-1 col-start-2 ${
          side === "left" ? "md:col-start-1 md:justify-self-end" : "md:col-start-3 md:justify-self-start"
        } flex items-center gap-4 ${side === "left" ? "md:flex-row-reverse" : ""} w-full md:w-auto md:max-w-[95%]`}
      >
        <div className="shrink-0 w-24 md:w-32 aspect-2/3 rounded-xl overflow-hidden border border-border shadow-lg shadow-black/20">
          <ItemImage
            imageUrl={imageUrl}
            imageHash={entry.imageHash}
            width="100%"
            height="100%"
            PlaceHolderIcon={PlaceholderIcon}
            borderRadius={[12, 12, 12, 12]}
            onClick={goToItem}
          />
        </div>

        <div className={`flex flex-col gap-1 min-w-0 ${textAlign}`}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-cyan">{dateLabel}</span>
          <h3
            className="text-base md:text-lg font-black text-gray-200 leading-tight line-clamp-2 hover:text-brand-purple transition-colors cursor-pointer"
            onClick={goToItem}
          >
            {entry.title}
          </h3>
          {seasons && <p className="text-sm text-gray-300">{seasons}</p>}
          {entry.isSeries && entry.episodeCount > 0 && (
            <p className="text-xs text-gray-400">{t("timeline.episodes", "{{episodeCount}} Episodes", { episodeCount: entry.episodeCount })}</p>
          )}
          <p className="flex items-center gap-1.5 text-[11px] text-gray-500 uppercase tracking-wider">
            <Clock size={12} />
            {durationLabel}
          </p>
        </div>
      </div>
    </li>
  );
}
