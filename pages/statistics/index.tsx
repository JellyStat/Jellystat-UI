import { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { 
  BarChart3, Loader2, AlertCircle, TrendingUp, Clock 
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from "recharts";

import client from "@/lib/api";
import { ChartStats } from "@/lib/models/chartStats";
import { ChartStat } from "@/lib/models/chartStat";

// --- THEME COLORS FOR CHART SERIES ---
const chartColors = [
  "#00a4dc", // brand-cyan
  "#aa3bff", // brand-purple
  "#34d399", // brand-emerald
  "#fbbf24", // brand-amber
  "#f43f5e", // brand-rose
];

export default function StatisticsPage() {
  const { t } = useTranslation("common");
  
  const [stats, setStats] = useState<ChartStats[]>([]);
  const [metric, setMetric] = useState<keyof ChartStat>("count");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.Stats.getStatsByDay({ days: 31 });
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
      color: chartColors[i % chartColors.length] 
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
      <Head>
        <title>{t("nav.statistics", "Statistics")} | Jellystat</title>
      </Head>

      <div className="space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-border/50 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-brand-purple/10 rounded-2xl border border-brand-purple/20 shadow-inner shrink-0">
              <BarChart3 size={28} className="text-brand-purple" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                {t("nav.statistics", "Statistics")}
              </h1>
              <p className="text-sm text-gray-400 mt-1 font-medium">
                {t("statistics.playback_trends", "31-Day global playback trends")} 
              </p>
            </div>
          </div>

          {/* Metric Selector Dropdown */}
          <div className="relative group min-w-[200px]">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 group-focus-within:text-brand-cyan transition-colors">
              {metric === "count" ? <TrendingUp size={16} /> : <Clock size={16} />}
            </div>
            <select
              value={metric}
              onChange={(e) => setMetric((e.target.value as keyof ChartStat) ?? "count")}
              className="w-full bg-surface/80 backdrop-blur-md border border-border hover:border-gray-500 rounded-xl py-2.5 pl-10 pr-8 text-sm font-bold text-gray-200 focus:outline-none focus:ring-1 focus:border-brand-cyan focus:ring-brand-cyan appearance-none transition-all cursor-pointer shadow-sm"
              disabled={loading}
            >
              <option value="count" className="bg-background text-gray-100">{t("statistics.play_count", "Play Count")}</option>
              <option value="playDuration" className="bg-background text-gray-100">{t("statistics.play_duration", "Play Duration")}</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-surface/40 backdrop-blur-sm border border-border rounded-3xl shadow-xl shadow-black/20 overflow-hidden flex flex-col p-6 sm:p-8">
          
          {loading ? (
            <div className="w-full h-[400px] flex flex-col items-center justify-center">
              <Loader2 size={40} className="text-brand-purple animate-spin mb-4" />
              <span className="text-gray-400 font-medium tracking-wide">{t("statistics.compiling", "Compiling 31-day statistics...")}</span>
            </div>
          ) : error ? (
            <div className="w-full h-[400px] flex items-center justify-center">
              <div className="p-5 rounded-2xl bg-brand-rose/10 border border-brand-rose/20 flex items-start gap-4">
                <AlertCircle size={24} className="text-brand-rose shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <h3 className="text-lg font-bold text-brand-rose mb-1">{t("statistics.telemetry_error", "Telemetry Error")}</h3>
                  <p className="text-sm text-brand-rose/80 font-medium">{error}</p>
                </div>
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="w-full h-[400px] border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-gray-500">
              <BarChart3 size={48} className="mb-4 opacity-20" />
              <span className="font-bold text-lg tracking-wide text-gray-400">{t("statistics.no_data", "No Data Available")}</span>
              <span className="text-sm mt-1">{t("statistics.no_data_desc", "There is no playback history for the last 31 days.")}</span>
            </div>
          ) : (
            <div className="w-full h-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    {/* Dynamically generate SVG gradients for every series */}
                    {chartSeries.map((series) => (
                      <linearGradient key={`color-${series.dataKey}`} id={`color-${series.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={series.color} stopOpacity={0.6}/>
                        <stop offset="95%" stopColor={series.color} stopOpacity={0}/>
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
                        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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
                      return val > 999 ? `${(val/1000).toFixed(1)}k` : val; // Compact numbers
                    }}
                  />
                  
                  <Tooltip content={<CustomTooltip formatValue={formatValue} metricType={metric} />} cursor={{ stroke: '#3f3f46', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  
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
      </div>
    </>
  );
}

const CustomTooltip = ({ active, payload, label, formatValue, metricType }: any) => {
  if (active && payload && payload.length) {
    // Format the date label cleanly
    let displayLabel = label;
    try {
      displayLabel = new Date(label).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    } catch { /* ignore */ }

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
                <span className="text-white font-mono font-bold tracking-tight">
                  {formatValue(entry.value)}
                </span>
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
        <div key={`item-${index}`} className="flex items-center gap-2 text-xs font-bold text-gray-300 transition-colors hover:text-white cursor-default">
          <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: entry.color }}></span>
          {entry.value}
        </div>
      ))}
    </div>
  );
};

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}