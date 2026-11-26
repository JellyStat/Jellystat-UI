import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BarChart3, AlertCircle, TrendingUp, Clock, Calendar, Calendar1, CalendarRange, ChevronDown } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

import client from "@/lib/api";
import { ChartStats } from "@/lib/models/chartStats";
import { ChartStat } from "@/lib/models/chartStat";
import NoData from "@/components/ErrorCards/NoData";
import ErrorCard from "../ErrorCards/ErrorCard";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";
import { DateRange } from "react-day-picker";
import StatMetric from "@/lib/models/enums/statMetric";
import { formatDateTime, formatHourOfDay, SHORT_DATE } from "@/lib/dateFormat";
import {
  chartColors as themeChartColors,
  chartSeries as seriesColors,
  cn,
  DateRangePicker,
  focusRing,
  Select,
  Spinner,
} from "@/components/ui";
import { HeadlessPopover as Popover, HeadlessPopoverPanel as PopoverPanel, PopoverButton } from "@/components/ui/headless";

// The API labels hourly buckets as "HH:00"; re-render them in the user's 12/24-hour style
function formatHourKey(key: string): string {
  const hour = parseInt(String(key).split(":")[0], 10);
  return Number.isNaN(hour) ? key : formatHourOfDay(hour);
}

// The API labels weekday buckets with English day names; match on the first three letters
// so both "Monday" and "Mon" resolve to a translation key.
const DAY_KEYS: Record<string, string> = {
  mon: "monday",
  tue: "tuesday",
  wed: "wednesday",
  thu: "thursday",
  fri: "friday",
  sat: "saturday",
  sun: "sunday",
};

export default function WatchTrendsCard() {
  const { t } = useTranslation("common");

  const formatDayKey = (key: string): string => {
    const dayKey = DAY_KEYS[String(key).slice(0, 3).toLowerCase()];
    return dayKey ? t(`statistics.days.${dayKey}`, key) : key;
  };

  const [stats, setStats] = useState<ChartStats[]>([]);
  const [metric, setMetric] = useState<keyof ChartStat>("count");
  const [timeGranularity, setTimeGranularity] = useState<StatMetric>(StatMetric.Date);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Libraries the user has toggled off via the legend
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());

  const toggleSeries = (name: string) => {
    setHiddenSeries((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

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
      color: seriesColors[i % seriesColors.length],
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

  // Only commit complete ranges so a half-picked range doesn't trigger a fetch.
  // Clearing the selection falls back to the default 31-day window.
  const handleDateRange = (range: DateRange | undefined) => {
    if (!range?.from) {
      setDateRange({ from: getDefaultStartDate(), to: getDefaultEndDate() });
      return;
    }
    if (!range.to) return;
    const from = new Date(range.from);
    from.setHours(0, 0, 0, 0);
    const to = new Date(range.to);
    to.setHours(23, 59, 59, 999);
    setDateRange({ from, to });
  };

  const dateRangeLabel =
    dateRange?.from && dateRange?.to
      ? `${formatDateTime(dateRange.from, SHORT_DATE)} → ${formatDateTime(dateRange.to, SHORT_DATE)}`
      : t("filter.date_range", "Date Range");

  return (
    <>
      <div className="flex flex-col w-full animate-in fade-in duration-500">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 size={28} className="text-primary shrink-0" />
            <h2 className="text-xl sm:text-xl font-bold text-white tracking-tight">
              {t("stats.watch_trends", "Watch Trends")}
            </h2>
          </div>
          <div className="grid grid-cols-1 min-[440px]:grid-cols-2 gap-2 sm:flex sm:items-end sm:gap-3">
            <Popover className="relative min-[440px]:col-span-2 sm:col-span-1">
              <PopoverButton
                disabled={loading}
                className={cn(
                  "relative w-full flex items-center bg-surface/80 backdrop-blur-md border border-border rounded-xl py-2.5 pl-10 pr-10 text-sm font-bold text-gray-200 shadow-sm transition-all cursor-pointer hover:border-border-strong data-open:border-primary disabled:opacity-50 disabled:cursor-not-allowed",
                  focusRing
                )}
              >
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                  <CalendarRange size={16} />
                </span>
                <span className="min-w-0 flex-1 truncate text-left whitespace-nowrap">{dateRangeLabel}</span>
                <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3.5 size-4 text-gray-500" />
              </PopoverButton>
              <PopoverPanel anchor="bottom end" className="z-50 [--anchor-gap:8px]">
                <DateRangePicker value={dateRange} onChange={handleDateRange} />
              </PopoverPanel>
            </Popover>
            <Select
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
            <Select
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
            title={t("empty.no_data", "No Data")}
            message={t("empty.there_is_no_playback_history_for_the", "There is no playback history for the last 31 days.")}
          />
        ) : (
          <div className="bg-surface/40 border border-border rounded-3xl shadow-xl shadow-black/20 overflow-hidden flex flex-col p-6 sm:p-8">
            {loading ? (
              <div className="w-full h-[400px] flex flex-col items-center justify-center">
                <Spinner size={40} className="text-primary mb-4" />
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

                    <CartesianGrid strokeDasharray="3 3" stroke={themeChartColors.grid} vertical={false} />

                    <XAxis
                      dataKey="key"
                      stroke={themeChartColors.axis}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={12}
                      // Format "YYYY-MM-DD" down to just "MMM DD" for cleaner UI
                      tickFormatter={(val) => {
                        try {
                          if (timeGranularity === StatMetric.Hour) {
                            return formatHourKey(val);
                          }
                          if (timeGranularity === StatMetric.Day) {
                            return formatDayKey(val);
                          }
                          return formatDateTime(val, { month: "short", day: "numeric" }) || val;
                        } catch {
                          return val;
                        }
                      }}
                    />

                    <YAxis
                      stroke={themeChartColors.axis}
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
                      content={
                        <CustomTooltip
                          formatValue={formatValue}
                          formatDayKey={formatDayKey}
                          metricType={metric}
                          timeGranularity={timeGranularity}
                        />
                      }
                      cursor={{ stroke: themeChartColors.cursor, strokeWidth: 1, strokeDasharray: "4 4" }}
                    />

                    <Legend
                      content={<CustomLegend hiddenSeries={hiddenSeries} onToggle={toggleSeries} />}
                      verticalAlign="top"
                      height={60}
                    />

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
                        hide={hiddenSeries.has(series.dataKey)}
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

const CustomTooltip = ({ active, payload, label, formatValue, formatDayKey, metricType, timeGranularity }: any) => {
  if (active && payload && payload.length) {
    // Format the date label cleanly
    let displayLabel = label;
    try {
      if (timeGranularity === StatMetric.Date) {
        displayLabel = formatDateTime(label, { weekday: "short", month: "short", day: "numeric" }) || label;
      } else if (timeGranularity === StatMetric.Hour) {
        displayLabel = formatHourKey(label);
      } else if (timeGranularity === StatMetric.Day) {
        displayLabel = formatDayKey(label);
      }
    } catch {
      /* ignore */
    }

    // Calculate total for the specific day
    const total = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);

    return (
      <div className="bg-surface/95 backdrop-blur-xl border border-border p-4 rounded-2xl shadow-2xl shadow-black/60 min-w-[180px]">
        <p className="text-gray-200 font-bold mb-3 pb-3 border-b border-border/50 text-sm tracking-tight flex justify-between">
          <span>{displayLabel}</span>
          <span className="text-accent ml-4">{formatValue(total)}</span>
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

const CustomLegend = ({ payload, hiddenSeries, onToggle }: any) => {
  return (
    <div className="flex justify-end gap-x-6 gap-y-3 mb-6 flex-wrap pr-4">
      {payload.map((entry: any, index: number) => {
        const hidden = hiddenSeries.has(entry.dataKey);
        return (
          <button
            type="button"
            key={`item-${index}`}
            onClick={() => onToggle(entry.dataKey)}
            aria-pressed={!hidden}
            className={cn(
              "flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer rounded-md",
              hidden ? "text-gray-500 line-through hover:text-gray-400" : "text-gray-300 hover:text-white",
              focusRing
            )}
          >
            <span
              className={cn("w-3 h-3 rounded-full shadow-sm transition-opacity", hidden && "opacity-30")}
              style={{ backgroundColor: entry.color }}
            ></span>
            {entry.value}
          </button>
        );
      })}
    </div>
  );
};
