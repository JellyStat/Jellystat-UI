import { CountModelWithSize } from "@/lib/models/countModelWithSize";
import { chartSeries } from "@/components/ui";
import { Film, HardDrive } from "lucide-react";

type Props = {
  data: CountModelWithSize[];
  colors?: readonly string[];
};

export default function StatSizeListCard({ data, colors = chartSeries }: Props) {
  const totalCount = data.reduce((sum, stat) => sum + (stat.count ?? 0), 0);

  const mappedData = data.map((item, index) => ({
    ...item,
    fill: colors[index % colors.length],
  }));

  return (
    <div className="flex flex-col gap-4 mt-4">
      {mappedData.map((stat, index) => {
        const share = totalCount > 0 ? ((stat.count ?? 0) / totalCount) * 100 : 0;
        return (
          <div key={`${stat.name ?? "stat"}-${index}`} className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="truncate uppercase text-xs font-bold">{stat.name ?? "Unknown"}</span>
              <div className="flex shrink-0 items-center gap-3 text-xs text-gray-400 tabular-nums">
                <span className="inline-flex items-center gap-1">
                  <Film className="h-3.5 w-3.5" aria-hidden="true" />
                  {(stat.count ?? 0).toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-1">
                  <HardDrive className="h-3.5 w-3.5" aria-hidden="true" />
                  {stat.size?.formatBytes()}
                </span>
              </div>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-hover">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${share.toFixed(2)}%`, backgroundColor: stat.fill }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
