import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "next-i18next/pages";
import { BarChart3, Loader2, AlertCircle, TrendingUp, Clock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

import client from "@/lib/api";
import { ChartStats } from "@/lib/models/chartStats";
import { ChartStat } from "@/lib/models/chartStat";
import NoData from "@/components/ErrorCards/NoData";
import DropdownSelector from "@/components/Core/DropdownSelector";
import ErrorCard from "../ErrorCards/ErrorCard";

// --- THEME COLORS FOR CHART SERIES ---
const chartColors = [
  "#00a4dc", // brand-cyan
  "#aa3bff", // brand-purple
  "#34d399", // brand-emerald
  "#fbbf24", // brand-amber
  "#f43f5e", // brand-rose
];

export default function WatchTrendsCard() {
  const { t } = useTranslation("common");

  const [stats, setStats] = useState<ChartStats[]>([]);
  const [metric, setMetric] = useState<keyof ChartStat>("count");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.Stats.getStatTrends({ days: 31 });
      setStats(data);
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      console.error(err);
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  // --- DATA TRANSFORMATION ---
  // Transform row-oriented ChartStats[] into Recharts shape
  function buildChartFromRows(rows: ChartStats[], activeMetric: keyof ChartStat) {
    const legends = Array.from(new Set(rows.flatMap((r) => r.stats.map((s) => s.legend))));

    const data = rows.map((r) => {
      const row: Record<string, any> = { key: r.key };
      for (const s of r.stats) row[s.legend] = s[activeMetric] ?? 0;
      // ensure all legends exist on row
      for (const l of legends) if (row[l] === undefined) row[l] = 0;
      return row;
    });

    const series = legends.map((l, i) => ({
      name: l,
      dataKey: l,
      color: chartColors[i % chartColors.length],
    }));

    return { data, series };
  }

  const { data: chartData, series: chartSeries } = buildChartFromRows(stats, metric);

  // --- FORMATTERS ---
  const formatValue = (val: number) => {
    if (metric === "playDuration") {
      // Safely invoke the prototype extension if it exists
      return (val as any).secondsToDurationString?.() || `${Math.round(val / 60)}m`;
    }
    return `${val}`;
  };

  return (
    <>
      <div className="flex flex-col w-full animate-in fade-in duration-500">
        {/* Header & Controls */}
        <div className="flex justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 size={28} className="text-brand-purple" />
            <h2 className="text-2xl font-black text-white tracking-tight">{t("stats.watch_trends", "Watch Trends")}</h2>
          </div>
          <DropdownSelector
            data={[
              { value: "count", Icon: TrendingUp },
              { value: "playDuration", Icon: Clock },
            ]}
            value={metric}
            onChange={(val) => setMetric((val as keyof ChartStat) ?? "count")}
            labelFn={(val) =>
              val === "count" ? t("statistics.play_count", "Play Count") : t("statistics.play_duration", "Play Duration")
            }
            disabled={loading}
          />
        </div>

        {/* Main Grid */}
        {!loading && !error && chartData.length === 0 ? (
          <NoData
            Icon={BarChart3}
            title={t("statistics.no_data", "No Data Available")}
            message={t("statistics.no_data_desc", "There is no playback history for the last 31 days.")}
          />
        ) : (
          <div className="bg-surface/40  border border-border rounded-3xl shadow-xl shadow-black/20 overflow-hidden flex flex-col p-6 sm:p-8">
            {loading ? (
              <div className="w-full h-[400px] flex flex-col items-center justify-center">
                <Loader2 size={40} className="text-brand-purple animate-spin mb-4" />
                <span className="text-gray-400 font-medium tracking-wide">
                  {t("statistics.compiling", "Compiling 31-day statistics...")}
                </span>
              </div>
            ) : error ? (
              <ErrorCard message={error} />
            ) : (
              <div className="w-full h-full min-h-[300px] [&_.recharts-wrapper]:outline-none [&_.recharts-wrapper_*]:outline-none">
                <ResponsiveContainer width="100%" height="100%" minHeight={400}>
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      {/* Dynamically generate SVG gradients for every series */}
                      {chartSeries.map((series) => (
                        <linearGradient
                          key={`color-${series.dataKey}`}
                          id={`color-${series.dataKey}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="5%" stopColor={series.color} stopOpacity={0.6} />
                          <stop offset="95%" stopColor={series.color} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />

                    <XAxis
                      dataKey="key"
                      stroke="#71717a"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={12}
                      // Format "YYYY-MM-DD" down to just "MMM DD" for cleaner UI
                      tickFormatter={(val) => {
                        try {
                          const d = new Date(val);
                          return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
                        } catch {
                          return val;
                        }
                      }}
                    />

                    <YAxis
                      stroke="#71717a"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={12}
                      tickFormatter={(val) => {
                        if (val === 0) return "0";
                        if (metric === "playDuration") return `${Math.round(val / 3600)}h`; // Rough hours for Y-axis scaling
                        return val > 999 ? `${(val / 1000).toFixed(1)}k` : val; // Compact numbers
                      }}
                    />

                    <Tooltip
                      content={<CustomTooltip formatValue={formatValue} metricType={metric} />}
                      cursor={{ stroke: "#3f3f46", strokeWidth: 1, strokeDasharray: "4 4" }}
                    />

                    <Legend content={<CustomLegend />} verticalAlign="top" height={60} />

                    {chartSeries.map((series) => (
                      <Area
                        key={series.dataKey}
                        type="monotone"
                        dataKey={series.dataKey}
                        name={series.name}
                        stroke={series.color}
                        strokeWidth={3}
                        fillOpacity={1}
                        fill={`url(#color-${series.dataKey})`}
                        stackId="1" // Stacks them on top of each other!
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

const CustomTooltip = ({ active, payload, label, formatValue, metricType }: any) => {
  if (active && payload && payload.length) {
    // Format the date label cleanly
    let displayLabel = label;
    try {
      displayLabel = new Date(label).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    } catch {
      /* ignore */
    }

    // Calculate total for the specific day
    const total = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);

    return (
      <div className="bg-surface/95 backdrop-blur-xl border border-border p-4 rounded-2xl shadow-2xl shadow-black/60 min-w-[180px]">
        <p className="text-gray-200 font-black mb-3 pb-3 border-b border-border/50 text-sm tracking-tight flex justify-between">
          <span>{displayLabel}</span>
          <span className="text-brand-cyan ml-4">{formatValue(total)}</span>
        </p>
        <div className="space-y-2.5">
          {payload.map((entry: any, index: number) => {
            if (entry.value === 0) return null; // Don't show empty stats in the tooltip
            return (
              <div key={index} className="flex items-center justify-between gap-6 text-xs font-medium">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: entry.color }}></span>
                  <span className="text-gray-400">{entry.name}</span>
                </div>
                <span className="text-white font-mono font-bold tracking-tight">{formatValue(entry.value)}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload }: any) => {
  return (
    <div className="flex justify-end gap-x-6 gap-y-3 mb-6 flex-wrap pr-4">
      {payload.map((entry: any, index: number) => (
        <div
          key={`item-${index}`}
          className="flex items-center gap-2 text-xs font-bold text-gray-300 transition-colors hover:text-white cursor-default"
        >
          <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: entry.color }}></span>
          {entry.value}
        </div>
      ))}
    </div>
  );
};
