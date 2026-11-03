import { useRouter } from "next/router";
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
  danger: { border: "hover:border-danger/50", text: "text-danger" },
};

const typeStyle: Record<string, { Icon: LucideIcon; tone: Tone }> = {
  movies: { Icon: Film, tone: "primary" },
  tvshows: { Icon: Tv, tone: "success" },
  music: { Icon: Music, tone: "warning" },
  homevideos: { Icon: ImageIcon, tone: "danger" },
  photos: { Icon: ImageIcon, tone: "danger" },
};

export default function LibraryOverviewCard({ library }: LibraryOverviewCardProps) {
  const router = useRouter();

  const { Icon, tone } = typeStyle[library.type?.toLowerCase() || ""] ?? { Icon: Folders, tone: "accent" as Tone };
  const hover = hoverClass[tone] ?? hoverClass.accent!;

  return (
    <div
      onClick={() => router.push(`/libraries/${library.id}`)}
      className={cn(
        "relative flex items-center p-4 bg-surface border border-border rounded-2xl cursor-pointer transition-all duration-300 group hover:-translate-y-0.5 shadow-lg shadow-black/20",
        hover.border,
      )}
    >
      <IconChip tone={tone} className="mr-4 transition-transform duration-300 group-hover:scale-110">
        <Icon size={22} />
      </IconChip>

      <div className="flex flex-col flex-1 min-w-0">
        <h3 className="text-sm font-bold text-gray-200 truncate group-hover:text-white transition-colors">{library.name}</h3>
        <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mt-0.5">
          {library.type || "Mixed Content"}
        </span>
      </div>

      <div className="pl-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
        <ChevronRight size={18} className={hover.text} />
      </div>
    </div>
  );
}
