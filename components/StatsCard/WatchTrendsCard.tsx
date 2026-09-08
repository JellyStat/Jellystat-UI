import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "next-i18next/pages";
import { BarChart3, Loader2, AlertCircle, TrendingUp, Clock, Calendar, Calendar1 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

import client from "@/lib/api";
import { ChartStats } from "@/lib/models/chartStats";
import { ChartStat } from "@/lib/models/chartStat";
import NoData from "@/components/ErrorCards/NoData";
import DropdownSelector from "@/components/Core/DropdownSelector";
import ErrorCard from "../ErrorCards/ErrorCard";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";
import { DateRange } from "react-day-picker";
import DateRangePickerButton from "../Core/DateRangePickerButton";
import StatMetric from "@/lib/models/enums/statMetric";

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
  const [timeGranularity, setTimeGranularity] = useState<StatMetric>(StatMetric.Date);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getDefaultStartDate = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const start = new Date(now);
    start.setDate(now.getDate() - 31);
    return start;
  };

  const getDefaultEndDate = () => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    return now;
  };

  const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: getDefaultStartDate(), to: getDefaultEndDate() });

  const fetchPage = useCallback(async () => {
    if (!dateRange || !dateRange.from || !dateRange.to) return;
    setLoading(true);
    setError(null);
    try {
      const query = new GridifyQueryBuilder();
      query.setPage(1);
      query.setPageSize(200);

      query.startGroup();
      query.addCondition("DateCreated", op.GreaterThanOrEqual, dateRange!.from!.toISOString());
      query.and();
      query.addCondition("DateCreated", op.LessThanOrEqual, dateRange!.to!.toISOString());
      query.endGroup();
      const builtQuery = query.build();
      const data = await client.Stats.getStatTrends(builtQuery, { metric: timeGranularity });
      setStats(data);
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      console.error(err);
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }, [dateRange, timeGranularity]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage, dateRange, timeGranularity]);

  // --- DATA TRANSFORMATION ---
  // Transform row-oriented ChartStats[] into Recharts shape
  function buildChartFromRows(rows: ChartStats[], activeMetric: keyof ChartStat) {
    const legends = Array.from(new Set(rows.flatMap((r) => r.stats.map((s) => s.legend))));
    console.log("Legends:", legends);

    const data = rows.map((r) => {
      const row: Record<string, any> = { key: r.key };
      // initialize all legends to 0 so missing series render as zero, not gaps
      for (const l of legends) row[l] = 0;
      // sum instead of assign, in case a row has multiple stats for the same legend
      for (const s of r.stats) row[s.legend] += s[activeMetric] ?? 0;
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

  const handleDateRange = (range: DateRange | undefined) => {
    if (!range) {
      range = { from: getDefaultStartDate(), to: getDefaultEndDate() };
    }
    setDateRange(range);
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
          <div className="flex items-end gap-3">
            {/* <DateRangePickerButton value={dateRange} onChange={handleDateRange} /> */}
            <DropdownSelector
              data={[
                { value: StatMetric.Date, Icon: Calendar },
                { value: StatMetric.Day, Icon: Calendar1 },
                { value: StatMetric.Hour, Icon: Clock },
              ]}
              value={timeGranularity}
              onChange={(val) => setTimeGranularity((val as StatMetric) ?? StatMetric.Date)}
              labelFn={(val) =>
                val === StatMetric.Date
                  ? t("statistics.by_date", "By Date")
                  : val === StatMetric.Day
                    ? t("statistics.by_day", "By Day")
                    : t("statistics.by_hour", "By Hour")
              }
              disabled={loading}
            />
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
                <span className="text-gray-400 font-medium tracking-wide">{t("common.loading", "Loading")}</span>
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
                          if (timeGranularity === StatMetric.Day || timeGranularity === StatMetric.Hour) {
                            return val;
                          }
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
                      content={<CustomTooltip formatValue={formatValue} metricType={metric} timeGranularity={timeGranularity} />}
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

const CustomTooltip = ({ active, payload, label, formatValue, metricType, timeGranularity }: any) => {
  if (active && payload && payload.length) {
    // Format the date label cleanly
    let displayLabel = label;
    try {
      if (timeGranularity === StatMetric.Date) {
        displayLabel = new Date(label).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
      }
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
