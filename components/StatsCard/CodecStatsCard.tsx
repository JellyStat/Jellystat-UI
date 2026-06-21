import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "next-i18next/pages";
import { BarChart3, Loader2, AlertCircle, TrendingUp, Clock, PieChartIcon } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie } from "recharts";

import client from "@/lib/api";
import { ChartStats } from "@/lib/models/chartStats";
import { ChartStat } from "@/lib/models/chartStat";
import NoData from "@/components/ErrorCards/NoData";
import DropdownSelector from "@/components/Core/DropdownSelector";
import { CountModel } from "@/lib/models/countModel";

// --- THEME COLORS FOR CHART SERIES ---
const chartColors = [
  "#00a4dc", // brand-cyan
  "#aa3bff", // brand-purple
  "#34d399", // brand-emerald
  "#fbbf24", // brand-amber
  "#f43f5e", // brand-rose
];

export default function CodecStatsCard() {
  const { t } = useTranslation("common");

  const [stats, setStats] = useState<CountModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.Stats.getCodecStats();
      const filteredData = data.filter((item) => item.name !== null && item.name !== undefined && item.name !== "");
      for (let i = 0; i < filteredData.length; i++) {
        filteredData[i].fill = chartColors[i % chartColors.length];
      }
      setStats(filteredData);
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

  return (
    <>
      <div className="flex flex-col w-full animate-in fade-in duration-500">
        {/* Header & Controls */}
        <div className="flex justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <PieChartIcon size={28} className="text-brand-purple" />
            <h2 className="text-2xl font-black text-white tracking-tight">{t("stats.codec_stats", "Codec Statistics")}</h2>
          </div>
        </div>

        {/* Main Grid */}
        {!loading && !error && stats.length === 0 ? (
          <NoData
            Icon={PieChartIcon}
            title={t("statistics.no_data", "No Data Available")}
            message={t("statistics.no_data_desc", "There is no playback history for the last 31 days.")}
          />
        ) : (
          <div className="bg-surface/40  border border-border rounded-3xl shadow-xl shadow-black/20 overflow-hidden flex flex-col p-6 sm:p-8 ">
            {loading ? (
              <div className="w-full h-[400px] flex flex-col items-center justify-center">
                <Loader2 size={40} className="text-brand-purple animate-spin mb-4" />
                <span className="text-gray-400 font-medium tracking-wide">
                  {t("statistics.compiling", "Compiling 31-day statistics...")}
                </span>
              </div>
            ) : error ? (
              <div className="w-full h-[400px] flex items-center justify-center">
                <div className="p-5 rounded-2xl bg-brand-rose/10 border border-brand-rose/20 flex items-start gap-4">
                  <AlertCircle size={24} className="text-brand-rose shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <h3 className="text-lg font-bold text-brand-rose mb-1">
                      {t("statistics.telemetry_error", "Telemetry Error")}
                    </h3>
                    <p className="text-sm text-brand-rose/80 font-medium">{error}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full min-h-[300px] flex justify-center [&_.recharts-wrapper]:outline-none [&_.recharts-wrapper_*]:outline-none">
                <PieChart style={{ width: "100%", maxWidth: "500px", maxHeight: "80vh", aspectRatio: 1 }} responsive>
                  <Pie
                    data={stats}
                    innerRadius="80%"
                    outerRadius="100%"
                    // Corner radius is the rounded edge of each pie slice

                    //   fill="#8884d8"
                    // padding angle is the gap between each pie slice
                    stroke="none"
                    paddingAngle={2}
                    dataKey="count"
                    isAnimationActive={true}
                  />

                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#3f3f46", strokeWidth: 1, strokeDasharray: "4 4" }} />
                  <Legend content={<CustomLegend />} verticalAlign="bottom" />
                </PieChart>
              </div>
            )}
          </div>
        )}
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

const CustomLegend = ({ payload }: any) => {
  //added divide by zero check to avoid NaN percentage when totalCount is 0
  const totalCount = Math.max(
    payload.reduce((sum: number, entry: any) => sum + (entry.payload.count || 0), 0),
    1,
  );
  return (
    <div className="flex justify-center gap-x-6 gap-y-3 mt-6 flex-wrap pr-4">
      {payload.map((entry: any, index: number) => (
        <div
          key={`item-${index}`}
          className="flex items-center gap-2 text-xs font-bold text-gray-300 transition-colors hover:text-white cursor-default  uppercase"
        >
          <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: entry.color }}></span>
          {entry.value}
          <span className="text-gray-400">({((entry.payload.count / totalCount) * 100).toFixed(1)}%)</span>
        </div>
      ))}
    </div>
  );
};
