import { CountModelWithSize } from "@/lib/models/countModelWithSize";

type Props = {
  data: CountModelWithSize[];
  colors?: string[];
};

export default function StatSizeListCard({
  data,
  colors = [
    "#00a4dc", // brand-cyan
    "#aa3bff", // brand-purple
    "#34d399", // brand-emerald
    "#fbbf24", // brand-amber
    "#f43f5e", // brand-rose
  ],
}: Props) {
  const totalCount = data.reduce((sum, stat) => sum + (stat.count ?? 0), 0);

  const mappedData = data.map((item, index) => ({
    ...item,
    fill: colors[index % colors.length],
  }));

  return (
    <div className="flex flex-col gap-2 mt-4">
      {mappedData.map((stat, index) => (
        <div key={`${stat.name ?? "stat"}-${index}`} className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate uppercase text-xs font-bold">{stat.name ?? "Unknown"}</span>
            <span className="shrink-0 text-sm text-gray-400">{stat.size?.formatBytes()}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-hover">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${totalCount > 0 ? (((stat.count ?? 0) / totalCount) * 100).toFixed(2) : "0"}%`,
                backgroundColor: stat.fill,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
