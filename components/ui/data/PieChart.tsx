import { Pie, PieChart as RechartsPieChart, Tooltip } from 'recharts';
import { chartColors, chartSeries } from '../chartColors';

export type PieChartDatum = {
  name: string | null;
  count?: number | null;
  // Overrides the series colour for this slice.
  color?: string;
};

export type PieChartProps = {
  data: PieChartDatum[];
  colors?: readonly string[];
};

// Donut chart with an external legend showing each slice's share.
export default function PieChart({ data, colors = chartSeries }: PieChartProps) {
  const mappedData = data.map((item, index) => ({
    ...item,
    fill: item.color || colors[index % colors.length],
  }));

  return (
    <>
      <div className="w-full h-[340px] flex justify-center [&_.recharts-wrapper]:outline-none [&_.recharts-wrapper_*]:outline-none">
        <RechartsPieChart
          style={{ width: '100%', maxWidth: '500px', maxHeight: '80vh', aspectRatio: 1 }}
          responsive
        >
          <Pie
            data={mappedData}
            innerRadius="80%"
            outerRadius="100%"
            stroke="none"
            paddingAngle={2}
            dataKey="count"
            isAnimationActive={true}
          />

          <Tooltip
            content={<ChartTooltip />}
            cursor={{ stroke: chartColors.cursor, strokeWidth: 1, strokeDasharray: '4 4' }}
          />
        </RechartsPieChart>
      </div>

      {/* External legend so it can grow without shrinking the chart */}
      <div className="mt-4">
        <ChartLegend items={mappedData} />
      </div>
    </>
  );
}

const ChartTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="bg-surface border border-border p-4 rounded-xl shadow-2xl shadow-black/40 min-w-[180px] space-y-2.5">
      {payload.map((entry: any, index: number) => {
        if (entry.value === 0) {
          return null; // Don't show empty stats in the tooltip
        }
        return (
          <div key={index} className="flex items-center justify-between gap-6 text-xs font-medium">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.payload.fill }}
              />
              <span className="text-gray-400">{entry.name}</span>
            </div>
            <span className="text-white font-mono font-bold tracking-tight">{entry.value}</span>
          </div>
        );
      })}
    </div>
  );
};

// Whole percentages; a non-empty slice never reads as 0%.
function formatShare(count: number, total: number) {
  if (!total || !count) return "0%";
  const pct = (count / total) * 100;
  return pct < 1 ? "<1%" : `${Math.round(pct)}%`;
}

const ChartLegend = ({ items }: { items: (PieChartDatum & { fill: string })[] }) => {
  const totalCount = Math.max(
    items.reduce((s, it) => s + (it.count || 0), 0),
    1
  );
  return (
    <div className="flex justify-center gap-x-6 gap-y-3 mt-2 flex-wrap pr-4">
      {items.map((entry, index) => (
        <div
          key={`item-${index}`}
          className="flex items-center gap-2 text-xs font-bold text-gray-200 uppercase cursor-default transition-colors hover:text-white"
        >
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.fill }} />
          {entry.name}
          <span className="text-gray-400">
            ({formatShare(entry.count || 0, totalCount)})
          </span>
        </div>
      ))}
    </div>
  );
};
