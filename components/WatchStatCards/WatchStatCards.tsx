import { useEffect, useState, useCallback } from "react";
import { Film, Tv, Library, MonitorPlay, Users, Activity, Trophy, Loader2, AlertCircle } from "lucide-react";
import { useTranslation } from "next-i18next/pages";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";

import client from "@/lib/api";
import ItemTypes from "@/lib/models/enums/ItemTypes";
import { LeaderboardCard } from "../WatchStatCard/LeaderboardCard";

export type WatchStatItem = {
  id: string;
  name: string;
  value: number;
  serverId?: string;
  navLink?: string;
};

export default function WatchStatCards() {
  const { t } = useTranslation("common");

  // --- STATE ---
  const [days, setDays] = useState<number>(30);
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState({
    viewedMovies: [] as WatchStatItem[],
    popularMovies: [] as WatchStatItem[],
    viewedShows: [] as WatchStatItem[],
    popularShows: [] as WatchStatItem[],
    libraries: [] as WatchStatItem[],
    clients: [] as WatchStatItem[],
    users: [] as WatchStatItem[],
    streams: [] as WatchStatItem[],
  });

  // --- DATA FETCHING ---
  const fetchAllStats = useCallback(async () => {
    setLoading(true);

    // Reusable Queries
    const movieQuery = new GridifyQueryBuilder()
      .addCondition("type", op.Equal, ItemTypes.Movie.toString())
      .and()
      .addCondition("playCount", op.GreaterThan, 0)
      .addOrderBy("playCount", true)
      .setPageSize(5)
      .build();

    const seriesQuery = new GridifyQueryBuilder()
      .addCondition("type", op.Equal, ItemTypes.Series.toString())
      .and()
      .addCondition("playCount", op.GreaterThan, 0)
      .addOrderBy("playCount", true)
      .setPageSize(5)
      .build();

    const genericQuery = new GridifyQueryBuilder()
      .addCondition("playCount", op.GreaterThan, 0)
      .addOrderBy("playCount", true)
      .setPageSize(5)
      .build();

    try {
      const results = await Promise.allSettled([
        client.Stats.getItemStats({ days }, movieQuery),
        client.Stats.getMostPopularItems({ days }, movieQuery),
        client.Stats.getItemStats({ days }, seriesQuery),
        client.Stats.getMostPopularItems({ days }, seriesQuery),
        client.Stats.getLibraryStats({ days }, genericQuery),
        client.Stats.getMostUsedClients({ days }, genericQuery),
        client.Stats.getUserStats({ days }, genericQuery),
        client.Stats.getTranscodeStats({ days }, genericQuery),
      ]);

      // Helper to safely extract data from settled promises
      const extract = (res: PromiseSettledResult<any>, mapper: (m: any) => WatchStatItem) => {
        if (res.status === "fulfilled" && res.value?.data) {
          return res.value.data.map(mapper);
        }
        return [];
      };

      setData({
        viewedMovies: extract(results[0], (m) => ({
          id: m.id,
          name: m.name,
          value: m.playCount ?? 0,
          navLink: `/libraries/items/${m.id}`,
          serverId: m.serverId,
        })),
        popularMovies: extract(results[1], (m) => ({
          id: m.id,
          name: m.name,
          value: m.playCount ?? 0,
          navLink: `/libraries/items/${m.id}`,
          serverId: m.serverId,
        })),
        viewedShows: extract(results[2], (m) => ({
          id: m.id,
          name: m.name,
          value: m.playCount ?? 0,
          navLink: `/libraries/items/${m.id}`,
          serverId: m.serverId,
        })),
        popularShows: extract(results[3], (m) => ({
          id: m.id,
          name: m.name,
          value: m.playCount ?? 0,
          navLink: `/libraries/items/${m.id}`,
          serverId: m.serverId,
        })),
        libraries: extract(results[4], (m) => ({
          id: m.id,
          name: m.name,
          value: m.playCount ?? 0,
          navLink: `/libraries/${m.id}`,
          serverId: m.serverId,
        })),
        clients: extract(results[5], (m) => ({ id: m.clientName, name: m.clientName, value: m.playCount ?? 0 })),
        users: extract(results[6], (m) => ({ id: m.id, name: m.username, value: m.playCount ?? 0, navLink: `/users/${m.id}` })),
        streams: extract(results[7], (m) => ({ id: m.name, name: m.name, value: m.playCount ?? 0 })),
      });
    } catch (err) {
      console.error("Failed to load watch stats", err);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchAllStats();
  }, [fetchAllStats]);

  const hasData = Object.values(data).some((arr) => arr.length > 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-200 tracking-tight flex items-center gap-3">
            <Activity className="text-brand-purple" size={28} />
            {t("watch_stat_cards.watch_statistics", "Watch Statistics")}
          </h2>
          <p className="text-sm text-gray-400 font-medium mt-1">
            {t("watch_stat_cards.watch_stats_desc", "Leaderboards for your most heavily utilized media and users.")}
          </p>
        </div>

        <div className="flex items-center gap-3 bg-surface/60 backdrop-blur-md border border-border p-1.5 rounded-xl shadow-inner">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-2">
            {t("watch_stat_cards.days", "Days")}:
          </label>
          <input
            type="number"
            min={1}
            max={999}
            value={days}
            onChange={(e) => setDays(Number(e.target.value) || 1)}
            className="w-20 bg-background border border-transparent hover:border-gray-500 focus:border-brand-purple rounded-lg px-2 py-1.5 text-sm font-bold text-gray-200 text-center focus:outline-none focus:ring-1 focus:ring-brand-purple transition-all"
          />
        </div>
      </div>

      {/* Main Grid */}
      {!loading && !hasData ? (
        <div className="bg-surface/50 border-2 border-dashed border-border rounded-3xl p-16 flex flex-col items-center justify-center text-center">
          <Activity size={48} className="text-gray-500 opacity-30 mb-4" />
          <h3 className="text-xl font-bold text-gray-300">{t("watch_stat_cards.no_data", "No Data Found")}</h3>
          <p className="text-sm text-gray-500">
            {t("watch_stat_cards.no_data_desc", "No watch statistics found for the selected period.")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          <LeaderboardCard
            title={t("watch_stat_cards.viewed_movies", "Most Viewed Movies")}
            unit={t("watch_stat_cards.unit_plays", "Plays")}
            items={data.viewedMovies}
            icon={Film}
            loading={loading}
          />
          <LeaderboardCard
            title={t("watch_stat_cards.popular_movies", "Most Popular Movies")}
            unit={t("watch_stat_cards.unit_users", "Users")}
            items={data.popularMovies}
            icon={Users}
            loading={loading}
          />
          <LeaderboardCard
            title={t("watch_stat_cards.viewed_shows", "Most Viewed Shows")}
            unit={t("watch_stat_cards.unit_plays", "Plays")}
            items={data.viewedShows}
            icon={Tv}
            loading={loading}
          />
          <LeaderboardCard
            title={t("watch_stat_cards.popular_shows", "Most Popular Shows")}
            unit={t("watch_stat_cards.unit_users", "Users")}
            items={data.popularShows}
            icon={Users}
            loading={loading}
          />
          <LeaderboardCard
            title={t("watch_stat_cards.viewed_libraries", "Most Viewed Libraries")}
            unit={t("watch_stat_cards.unit_plays", "Plays")}
            items={data.libraries}
            icon={Library}
            loading={loading}
          />
          <LeaderboardCard
            title={t("watch_stat_cards.used_clients", "Most Used Clients")}
            unit={t("watch_stat_cards.unit_plays", "Plays")}
            items={data.clients}
            icon={MonitorPlay}
            loading={loading}
          />
          <LeaderboardCard
            title={t("watch_stat_cards.active_users", "Most Active Users")}
            unit={t("watch_stat_cards.unit_plays", "Plays")}
            items={data.users}
            icon={Users}
            loading={loading}
          />
          <LeaderboardCard
            title={t("watch_stat_cards.concurrent_streams", "Concurrent Streams")}
            unit={t("watch_stat_cards.unit_streams", "Streams")}
            items={data.streams}
            icon={Activity}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
}
