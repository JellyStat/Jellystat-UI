import { Pie, PieChart, Tooltip } from "recharts";

export type Props = {
  data: any[];
  colors?: string[];
};

export default function JPieChart({
  data,
  colors = [
    "#00a4dc", // brand-cyan
    "#aa3bff", // brand-purple
    "#34d399", // brand-emerald
    "#fbbf24", // brand-amber
    "#f43f5e", // brand-rose
  ],
}: Props) {
  const mappedData = data.map((item, index) => ({
    ...item,
    fill: item.color || colors[index % colors.length],
  }));

  return (
    <>
      <div className="w-full h-[340px] flex justify-center [&_.recharts-wrapper]:outline-none [&_.recharts-wrapper_*]:outline-none">
        <PieChart style={{ width: "100%", maxWidth: "500px", maxHeight: "80vh", aspectRatio: 1 }} responsive>
          <Pie
            data={mappedData}
            innerRadius="80%"
            outerRadius="100%"
            stroke="none"
            paddingAngle={2}
            dataKey="count"
            isAnimationActive={true}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#3f3f46", strokeWidth: 1, strokeDasharray: "4 4" }} />
        </PieChart>
      </div>

      {/* External legend so it can grow without shrinking the chart */}
      <div className="mt-4">
        <ChartLegendFromStats items={mappedData} />
      </div>
    </>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface/95 backdrop-blur-xl border border-border p-4 rounded-2xl shadow-2xl shadow-black/60 min-w-[180px]">
        <div className="space-y-2.5">
          {payload.map((entry: any, index: number) => {
            if (entry.value === 0) return null; // Don't show empty stats in the tooltip
            return (
              <div key={index} className="flex items-center justify-between gap-6 text-xs font-medium">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: entry.color }}></span>
                  <span className="text-gray-400">{entry.name}</span>
                </div>
                <span className="text-white font-mono font-bold tracking-tight">{entry.value}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

const ChartLegendFromStats = ({ items }: { items: any[] }) => {
  const totalCount = Math.max(
    items.reduce((s, it) => s + (it.count || 0), 0),
    1,
  );
  return (
    <div className="flex justify-center gap-x-6 gap-y-3 mt-2 flex-wrap pr-4">
      {items.map((entry: any, index: number) => (
        <div
          key={`item-${index}`}
          className="flex items-center gap-2 text-xs font-bold text-gray-300 transition-colors hover:text-white cursor-default  uppercase"
        >
          <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: entry.fill || entry.color }}></span>
          {entry.name}
          <span className="text-gray-400">({(((entry.count || 0) / totalCount) * 100).toFixed(2)}%)</span>
        </div>
      ))}
    </div>
  );
};
