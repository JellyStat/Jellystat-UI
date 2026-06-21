import React, { useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import type { LibrariesWithStats } from "@/lib/models/librariesWithStats";
import { API_BASE } from "@/lib/api";
import { Image as ImageIcon, Film, Tv, Music, Folders, HardDrive, PlaySquare, Clock, Timer, History } from "lucide-react";
import Badge from "../Core/Badge";

export default function LibraryCard({ lib }: { lib: LibrariesWithStats }) {
  const router = useRouter();
  const { t, i18n } = useTranslation("common");
  const [imageError, setImageError] = useState(false);

  const imgUrl = new URL(
    `/Proxy/Images/Items/Primary?Id=${encodeURIComponent(lib.id)}&Width=600&Quality=90&Blur=0&ServerId=${encodeURIComponent(
      lib.serverId,
    )}`,
    API_BASE,
  ).toString();

  let FallbackIcon = Folders;
  let colorClasses = {
    text: "text-brand-cyan",
    bg: "bg-brand-cyan/20",
    border: "border-brand-cyan/30",
  };

  const typeStr = lib.type?.toLowerCase() || "";
  if (typeStr === "movies") {
    FallbackIcon = Film;
    colorClasses = { text: "text-brand-purple", bg: "bg-brand-purple/20", border: "border-brand-purple/30" };
  } else if (typeStr === "tvshows") {
    FallbackIcon = Tv;
    colorClasses = { text: "text-brand-emerald", bg: "bg-brand-emerald/20", border: "border-brand-emerald/30" };
  } else if (typeStr === "music") {
    FallbackIcon = Music;
    colorClasses = { text: "text-brand-amber", bg: "bg-brand-amber/20", border: "border-brand-amber/30" };
  } else if (typeStr === "homevideos" || typeStr === "photos") {
    FallbackIcon = ImageIcon;
    colorClasses = { text: "text-brand-rose", bg: "bg-brand-rose/20", border: "border-brand-rose/30" };
  }

  const lastPlayed = lib.latestActivity?.seriesName ?? lib.latestActivity?.name ?? t("library.never", "Never");
  const lastActivityDate = lib.latestActivity?.dateCreated
    ? new Date(lib.latestActivity.dateCreated).toLocaleDateString(i18n.language || undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : t("library.na", "N/A");

  return (
    <div
      onClick={() => router.push(`/libraries/${encodeURIComponent(lib.id)}`)}
      className="group flex flex-col bg-surface/50 backdrop-blur-md border border-border rounded-2xl overflow-hidden hover:border-gray-500 transition-all duration-300 shadow-xl shadow-black/20 hover:-translate-y-1 hover:shadow-2xl cursor-pointer min-h-[380px]"
    >
      {/* Header & Image Banner */}
      <div className="relative h-40 w-full overflow-hidden bg-background shrink-0">
        {!imageError && imgUrl ? (
          <img
            src={imgUrl}
            alt={lib.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface">
            <FallbackIcon
              size={48}
              className={`${colorClasses.text} opacity-50 transition-transform duration-500 group-hover:scale-110`}
            />
          </div>
        )}

        {/* Gradient Blending Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/80 to-transparent"></div>

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 w-full p-5 flex justify-between items-end">
          <h2 className="text-2xl font-black text-gray-200 tracking-tight drop-shadow-lg truncate pr-4">{lib.name}</h2>
          <Badge value={lib.type} shape="square" />
        </div>
      </div>

      {/* Stats Body */}
      <div className="p-5 flex flex-col flex-1 gap-5 bg-surface/40">
        {/* Metric Grid */}
        <div className="grid grid-cols-2 gap-4">
          <StatBlock
            icon={<HardDrive size={14} />}
            label={t("library.total_size", "Total Size")}
            value={lib.size?.formatBytes() ?? "0 B"}
          />
          <StatBlock
            icon={<Clock size={14} />}
            label={t("library.library_time", "Library Time")}
            value={lib.playbackDuration?.ticksToDurationString() ?? "0s"}
          />
          <StatBlock
            icon={<PlaySquare size={14} />}
            label={t("library.total_plays", "Total Plays")}
            value={lib.playCount?.toString() ?? "0"}
          />
          <StatBlock
            icon={<Timer size={14} />}
            label={t("library.time_watched", "Time Watched")}
            value={lib.playDuration?.secondsToDurationString() ?? "0s"}
          />
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-border/50 rounded-full"></div>

        {/* Activity & Breakdown */}
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2 text-sm">
            <History size={16} className="text-gray-500 shrink-0 mt-0.5" />
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                {t("library.last_played", "Last Played")}
              </span>
              <span className="font-medium text-gray-200 truncate">{lastPlayed}</span>
              <span className="text-[10px] font-mono text-gray-400 mt-0.5">{lastActivityDate}</span>
            </div>
          </div>

          {/* Type Counts Tags */}
          {lib.typeCounts && lib.typeCounts.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {lib.typeCounts.map((tItem) => (
                <div
                  key={tItem.type}
                  className="flex items-center bg-background border border-border px-2 py-1 rounded text-[11px] font-bold text-gray-300 shadow-inner"
                >
                  <span className="text-gray-500 mr-1.5">{tItem.type}:</span>
                  {tItem.count ?? 0}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBlock({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
        {icon} {label}
      </div>
      <span className="text-sm font-black text-gray-200 tracking-tight truncate">{value}</span>
    </div>
  );
}
