import { useTranslation } from "react-i18next";
import { HardDrive, Clapperboard } from "lucide-react";
import type { LibrariesWithStats } from "@/lib/models/librariesWithStats";
import ItemTypeIcons from "@/lib/declarations/itemIcons";

interface Props {
  library: LibrariesWithStats;
}

export default function LibraryInfoOverviewCard({ library }: Props) {
  const { t } = useTranslation("common");

  return (
    <div className="w-full  ">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-px bg-[#14151a] border border-[#22242b] rounded-xl overflow-hidden divide-y md:divide-y-0 md:divide-x divide-[#22242b]">
        <div className="p-6 flex items-center gap-4">
          <div className="flex items-center justify-center w-14 h-14 bg-[#1a1c23] border border-[#262933] rounded-xl text-emerald-400">
            <HardDrive className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold tracking-wider text-gray-400 uppercase">Total Storage</span>
            <span className="text-3xl font-extrabold text-white tracking-tight mt-0.5">{library.size?.formatBytes()}</span>
          </div>
        </div>

        <div className="p-6 flex items-center gap-4">
          <div className="flex items-center justify-center w-14 h-14 bg-[#1a1c23] border border-[#262933] rounded-xl text-sky-400">
            <Clapperboard className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold tracking-wider text-gray-400 uppercase">Total Media</span>
            <span className="text-3xl font-extrabold text-white tracking-tight mt-0.5">
              {library.typeCounts?.reduce((acc, count) => acc + (count.count ?? 0), 0)}
            </span>
          </div>
        </div>

        {library.typeCounts &&
          library.typeCounts.map((count) => {
            let ItemIcon = Clapperboard;
            ItemIcon = ItemTypeIcons[count.type as keyof typeof ItemTypeIcons] || ItemIcon;

            return (
              <div key={count.type} className="p-6 flex items-center gap-4">
                {/* Icon Container */}
                <div className="flex items-center justify-center w-14 h-14 bg-[#1a1c23] border border-[#262933] rounded-xl text-sky-400">
                  <ItemIcon className="w-6 h-6 stroke-[1.5]" />
                </div>
                {/* Text Content */}
                <div className="flex flex-col">
                  <span className="text-xs font-bold tracking-wider text-gray-400 uppercase">{count.type}</span>
                  <span className="text-3xl font-extrabold text-white tracking-tight mt-0.5">{count.count}</span>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
