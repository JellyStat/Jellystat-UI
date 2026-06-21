import { useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { Image as ImageIcon } from "lucide-react";

import { API_BASE } from "@/lib/api";
import LibraryTypeIcons from "@/lib/declarations/libraryIcons";
import { TrackedLibraries } from "@/lib/models/trackedLibraries";
import Badge from "../Core/Badge";

export default function LibraryTrackingCard({
  lib,
  toggleLibraryTracking,
}: {
  lib: TrackedLibraries;
  toggleLibraryTracking: (libraryId: string, tracked: boolean) => void;
}) {
  const router = useRouter();
  const { t } = useTranslation("common");
  const [imageError, setImageError] = useState(false);

  const imgUrl = new URL(
    `/Proxy/Images/Items/Primary?Id=${encodeURIComponent(lib.id)}&Width=600&Quality=90&Blur=0&ServerId=${encodeURIComponent(
      lib.serverId,
    )}`,
    API_BASE,
  ).toString();

  const Icon = LibraryTypeIcons[lib.type] ?? ImageIcon;

  return (
    <div className="bg-surface/60 backdrop-blur-xl border border-border rounded-2xl shadow-lg shadow-black/20 overflow-hidden flex flex-col transition-all hover:border-gray-600 hover:shadow-black/40 group relative">
      {/* Image Container */}
      <div
        className="h-48 md:h-56 relative cursor-pointer overflow-hidden bg-black/40"
        onClick={() => router.push(`/libraries/${encodeURIComponent(lib.id)}`)}
      >
        {imgUrl && !imageError ? (
          <>
            <img
              src={imgUrl}
              alt={lib.name}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              onError={() => setImageError(true)}
              onLoad={() => setImageError(false)}
            />
            {/* Dark gradient overlay to blend image into the card body */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-surface/90 to-transparent pointer-events-none"></div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
            <Icon size={56} className="text-gray-600 drop-shadow-md" />
          </div>
        )}
      </div>

      {/* Details Footer */}
      <div className="p-5 flex flex-col flex-1 gap-4 relative z-10 -mt-2 bg-gradient-to-b from-transparent to-surface/80">
        {/* Header: Name and Type Badge */}
        <div className="flex items-start justify-between gap-3 w-full">
          <h3 className="text-lg font-bold text-gray-100 leading-tight line-clamp-2">{lib.name}</h3>
          <Badge value={lib.type} shape="square" />
        </div>

        <div className="flex-1"></div>

        {/* Tracking Toggle */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <span className="text-sm font-medium text-gray-400">{t("library.tracked", "Tracked")}</span>
          <button
            onClick={() => toggleLibraryTracking(lib.id, !lib.tracked)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:ring-offset-2 focus:ring-offset-background ${
              lib.tracked ? "bg-brand-emerald" : "bg-background border border-border shadow-inner"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                lib.tracked ? "translate-x-6 shadow-md" : "translate-x-1 opacity-70"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
