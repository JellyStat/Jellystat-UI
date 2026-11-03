import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Film, Tv, Music, Image as ImageIcon, Folders, ChevronRight, type LucideIcon } from "lucide-react";
import { LibrariesWithStats } from "@/lib/models/librariesWithStats";
import { cn, IconChip, type Tone } from "@/components/ui";

interface LibraryOverviewCardProps {
  library: LibrariesWithStats;
}

// Full class strings per tone so Tailwind can see them at build time.
const hoverClass: Partial<Record<Tone, { border: string; text: string }>> = {
  accent: { border: "hover:border-accent/50", text: "text-accent" },
  primary: { border: "hover:border-primary/50", text: "text-primary" },
  success: { border: "hover:border-success/50", text: "text-success" },
  warning: { border: "hover:border-warning/50", text: "text-warning" },
  info: { border: "hover:border-info/50", text: "text-info" },
};

// Library types are categories, not states, so none of them use the danger (red) tone.
const typeStyle: Record<string, { Icon: LucideIcon; tone: Tone }> = {
  movies: { Icon: Film, tone: "primary" },
  tvshows: { Icon: Tv, tone: "success" },
  music: { Icon: Music, tone: "warning" },
  homevideos: { Icon: ImageIcon, tone: "info" },
  photos: { Icon: ImageIcon, tone: "info" },
};

export default function LibraryOverviewCard({ library }: LibraryOverviewCardProps) {
  const { t } = useTranslation("common");

  const { Icon, tone } = typeStyle[library.type?.toLowerCase() || ""] ?? { Icon: Folders, tone: "accent" as Tone };
  const hover = hoverClass[tone] ?? hoverClass.accent!;

  return (
    <Link
      href={`/libraries/${library.id}`}
      className={cn(
        "relative flex items-center p-4 bg-surface/50 border border-border rounded-2xl transition-all duration-300 group hover:-translate-y-0.5 shadow-md shadow-black/20 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary",
        hover.border,
      )}
    >
      <IconChip tone={tone} className="mr-4 transition-transform duration-300 group-hover:scale-110">
        <Icon size={22} />
      </IconChip>

      <div className="flex flex-col flex-1 min-w-0">
        <h3 className="text-sm font-bold text-gray-100 truncate group-hover:text-white transition-colors">{library.name}</h3>
        <span className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-0.5">
          {library.type || t("libraries.mixed_content", "Mixed Content")}
        </span>
      </div>

      <div className="pl-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-focus-visible:opacity-100 group-hover:translate-x-0 transition-all duration-300">
        <ChevronRight size={18} className={hover.text} />
      </div>
    </Link>
  );
}
