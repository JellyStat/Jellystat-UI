import { useEffect, useState, useCallback } from "react";
import { Film, Tv, Library, MonitorPlay, Users, Activity, Trophy, Loader2, AlertCircle, PieChart } from "lucide-react";
import { useTranslation } from "next-i18next/pages";
import { GridifyQueryBuilder, IGridifyQuery, ConditionalOperator as op } from "gridify-client";

import client from "@/lib/api";
import { GenreStats } from "@/lib/models/genreStats";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, Tooltip } from "recharts";
import GenreStatCard from "./GenreStatCard";
type Props = {
  gridify?: IGridifyQuery;
};

export default function GenreStatsCard({ gridify }: Props) {
  const { t } = useTranslation("common");

  // --- STATE ---
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<GenreStats[]>([]);

  // --- DATA FETCHING ---
  const fetchAllStats = useCallback(async () => {
    setLoading(true);

    // Reusable Queries
    const genericQuery = gridify ?? new GridifyQueryBuilder().addCondition("playCount", op.GreaterThan, 0).build();

    try {
      const res = await client.Stats.getGenreStats(genericQuery);
      setData(res ?? []);
    } catch (err) {
      console.error("Failed to load genre stats", err);
    } finally {
      setLoading(false);
    }
  }, [gridify]);

  useEffect(() => {
    fetchAllStats();
  }, [fetchAllStats]);

  const hasData = data.length > 0;

  return (
    <div className="flex flex-col w-full animate-in fade-in duration-500">
      {/* Header & Controls */}
      <div className="flex items-center gap-3 mb-6">
        <PieChart className="text-brand-emerald" size={28} />
        <h2 className="text-2xl font-black text-white tracking-tight">{t("library.genres", "Genres")}</h2>
      </div>

      {/* Main Grid */}
      {!loading && !hasData ? (
        <div className="bg-surface/50 border-2 border-border rounded-3xl p-16 flex flex-col items-center justify-center text-center">
          <Activity size={48} className="text-gray-500 opacity-30 mb-4" />
          <h3 className="text-xl font-bold text-gray-300">{t("stat_cards.no_data", "No Data Found")}</h3>
          <p className="text-sm text-gray-500">{t("stat_cards.no_data_desc", "No genre statistics found for this item")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500 space-between">
          <GenreStatCard data={data} dataKey="playCount" />
          <GenreStatCard data={data} dataKey="playDuration" />
        </div>
      )}
    </div>
  );
}
