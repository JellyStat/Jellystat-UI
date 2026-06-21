import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "next-i18next/pages";
import { Loader2, AlertCircle, PieChartIcon } from "lucide-react";

import client from "@/lib/api";
import NoData from "@/components/ErrorCards/NoData";
import { CountModel } from "@/lib/models/countModel";
import JPieChart from "../Core/PieChart";
import ErrorCard from "../ErrorCards/ErrorCard";

export default function ResolutionStatsCard() {
  const { t } = useTranslation("common");

  const [stats, setStats] = useState<CountModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.Stats.getResolutionStats();
      const filteredData = data.filter((item) => item.name !== null && item.name !== undefined);
      for (let i = 0; i < filteredData.length; i++) {
        if (filteredData[i].name === "") {
          filteredData[i].name = t("statistics.resolution_unknown", "Unknown");
        }
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
  const content = (() => {
    if (!loading && !error && stats.length === 0) {
      return (
        <NoData
          Icon={PieChartIcon}
          title={t("statistics.no_data", "No Data Available")}
          message={t("statistics.no_data_desc", "There is no playback history for the last 31 days.")}
        />
      );
    }

    return (
      <div className="bg-surface/40  border border-border rounded-3xl shadow-xl shadow-black/20 overflow-hidden flex flex-col h-full p-6 sm:p-8 ">
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
          <JPieChart data={stats} />
        )}
      </div>
    );
  })();

  return (
    <>
      <div className="flex flex-col w-full h-full animate-in fade-in duration-500">
        {/* Header & Controls */}
        <div className="flex justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <PieChartIcon size={28} className="text-brand-purple" />
            <h2 className="text-2xl font-black text-white tracking-tight">
              {t("stats.resolution_stats", "Resolution Statistics")}
            </h2>
          </div>
        </div>

        {/* Main Grid */}
        {content}
      </div>
    </>
  );
}
