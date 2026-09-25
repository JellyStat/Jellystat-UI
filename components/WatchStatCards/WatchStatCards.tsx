import { useEffect, useState, useCallback } from "react";
import { Film, Tv, Library, MonitorPlay, Users, Activity, Trophy, Loader2, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";

import client from "@/lib/api";
import ItemTypes from "@/lib/models/enums/ItemTypes";
import { LeaderboardCard } from "../WatchStatCard/LeaderboardCard";
import NumberField from "../Core/NumberField";

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

  // individual loading states so each card shows its loader until its api call resolves
  const [loadingStates, setLoadingStates] = useState({
    viewedMovies: true,
    popularMovies: true,
    viewedShows: true,
    popularShows: true,
    libraries: true,
    clients: true,
    users: true,
    streams: true,
  });

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
  const fetchAllStats = useCallback(() => {
    // mark all loaders true and clear previous data while new fetch starts
    setLoadingStates({
      viewedMovies: true,
      popularMovies: true,
      viewedShows: true,
      popularShows: true,
      libraries: true,
      clients: true,
      users: true,
      streams: true,
    });
    setData({
      viewedMovies: [],
      popularMovies: [],
      viewedShows: [],
      popularShows: [],
      libraries: [],
      clients: [],
      users: [],
      streams: [],
    });

    // Reusable Queries
    const movieQuery = new GridifyQueryBuilder()
      .addCondition("playCount", op.GreaterThan, 0)
      .and()
      .addCondition("type", op.Equal, ItemTypes.Movie.toString())
      .addOrderBy("playCount", true)
      .addOrderBy("LatestActivityDate", true)
      .setPageSize(5)
      .build();

    const seriesQuery = new GridifyQueryBuilder()
      .addCondition("playCount", op.GreaterThan, 0)
      .and()
      .addCondition("type", op.Equal, ItemTypes.Series.toString())
      .addOrderBy("playCount", true)
      .addOrderBy("LatestActivityDate", true)
      .setPageSize(5)
      .build();

    const transcodeQuery = new GridifyQueryBuilder()
      .addCondition("playCount", op.GreaterThan, 0)
      .addOrderBy("playCount", true)
      .setPageSize(5)
      .build();

    const genericQuery = new GridifyQueryBuilder()
      .addCondition("playCount", op.GreaterThan, 0)
      .addOrderBy("playCount", true)
      .addOrderBy("LatestActivityDate", true)
      .setPageSize(5)
      .build();

    // Fire all requests concurrently and update each card as it completes
    client.Stats.getItemStats({ days }, movieQuery)
      .then((res) => {
        const items = Array.isArray(res?.data) ? res!.data : [];
        setData((prev) => ({
          ...prev,
          viewedMovies: items.map((m: any) => ({
            id: m.id,
            name: m.name,
            value: m.playCount ?? 0,
            navLink: `/libraries/items/${m.id}`,
            serverId: m.serverId,
          })),
        }));
      })
      .catch((err) => console.error("Failed to load viewed movies", err))
      .finally(() => setLoadingStates((s) => ({ ...s, viewedMovies: false })));

    client.Stats.getMostPopularItems({ days }, movieQuery)
      .then((res) => {
        const items = Array.isArray(res?.data) ? res!.data : [];
        setData((prev) => ({
          ...prev,
          popularMovies: items.map((m: any) => ({
            id: m.id,
            name: m.name,
            value: m.playCount ?? 0,
            navLink: `/libraries/items/${m.id}`,
            serverId: m.serverId,
          })),
        }));
      })
      .catch((err) => console.error("Failed to load popular movies", err))
      .finally(() => setLoadingStates((s) => ({ ...s, popularMovies: false })));

    client.Stats.getItemStats({ days }, seriesQuery)
      .then((res) => {
        const items = Array.isArray(res?.data) ? res!.data : [];
        setData((prev) => ({
          ...prev,
          viewedShows: items.map((m: any) => ({
            id: m.id,
            name: m.name,
            value: m.playCount ?? 0,
            navLink: `/libraries/items/${m.id}`,
            serverId: m.serverId,
          })),
        }));
      })
      .catch((err) => console.error("Failed to load viewed shows", err))
      .finally(() => setLoadingStates((s) => ({ ...s, viewedShows: false })));

    client.Stats.getMostPopularItems({ days }, seriesQuery)
      .then((res) => {
        const items = Array.isArray(res?.data) ? res!.data : [];
        setData((prev) => ({
          ...prev,
          popularShows: items.map((m: any) => ({
            id: m.id,
            name: m.name,
            value: m.playCount ?? 0,
            navLink: `/libraries/items/${m.id}`,
            serverId: m.serverId,
          })),
        }));
      })
      .catch((err) => console.error("Failed to load popular shows", err))
      .finally(() => setLoadingStates((s) => ({ ...s, popularShows: false })));

    client.Stats.getLibraryStats({ days }, genericQuery)
      .then((res) => {
        const items = Array.isArray(res?.data) ? res!.data : [];
        setData((prev) => ({
          ...prev,
          libraries: items.map((m: any) => ({
            id: m.id,
            name: m.name,
            value: m.playCount ?? 0,
            navLink: `/libraries/${m.id}`,
            serverId: m.serverId,
          })),
        }));
      })
      .catch((err) => console.error("Failed to load libraries", err))
      .finally(() => setLoadingStates((s) => ({ ...s, libraries: false })));

    client.Stats.getMostUsedClients({ days }, genericQuery)
      .then((res) => {
        const items = Array.isArray(res?.data) ? res!.data : [];
        setData((prev) => ({
          ...prev,
          clients: items.map((m: any) => ({ id: m.clientName, name: m.clientName, value: m.playCount ?? 0 })),
        }));
      })
      .catch((err) => console.error("Failed to load clients", err))
      .finally(() => setLoadingStates((s) => ({ ...s, clients: false })));

    client.Stats.getUserStats({ days }, genericQuery)
      .then((res) => {
        const items = Array.isArray(res?.data) ? res!.data : [];
        setData((prev) => ({
          ...prev,
          users: items.map((m: any) => ({ id: m.id, name: m.username, value: m.playCount ?? 0, navLink: `/users/${m.id}` })),
        }));
      })
      .catch((err) => console.error("Failed to load users", err))
      .finally(() => setLoadingStates((s) => ({ ...s, users: false })));

    client.Stats.getTranscodeStats({ days }, transcodeQuery)
      .then((res) => {
        const items = Array.isArray(res?.data) ? res!.data : [];
        setData((prev) => ({
          ...prev,
          streams: items.map((m: any) => ({ id: m.name, name: m.name, value: m.playCount ?? 0 })),
        }));
      })
      .catch((err) => console.error("Failed to load streams", err))
      .finally(() => setLoadingStates((s) => ({ ...s, streams: false })));
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
          <NumberField
            value={days}
            min={1}
            max={999}
            onChange={(value) => setDays(value ?? 1)}
            className="w-20 appearance-none bg-background border border-transparent hover:border-gray-500 focus:border-brand-purple rounded-lg px-2 py-1.5 text-sm font-bold text-gray-200 text-center focus:outline-none focus:ring-1 focus:ring-brand-purple "
          />
        </div>
      </div>

      {/* Main Grid */}
      {Object.values(loadingStates).every((v) => !v) && !hasData ? (
        <div className="bg-surface/50 border-2 border-dashed border-border rounded-3xl p-16 flex flex-col items-center justify-center text-center">
          <Activity size={48} className="text-gray-500 opacity-30 mb-4" />
          <h3 className="text-xl font-bold text-gray-300">{t("common.no_data", "No Data")}</h3>
          <p className="text-sm text-gray-500">
            {t("watch_stat_cards.no_data_desc", "No watch statistics found for the selected period.")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          <LeaderboardCard
            title={t("watch_stat_cards.viewed_movies", "Most Viewed Movies")}
            unit={t("common.unit.plays", "Plays")}
            items={data.viewedMovies}
            icon={Film}
            loading={loadingStates.viewedMovies}
          />
          <LeaderboardCard
            title={t("watch_stat_cards.popular_movies", "Most Popular Movies")}
            unit={t("common.unit.users", "Users")}
            items={data.popularMovies}
            icon={Users}
            loading={loadingStates.popularMovies}
          />
          <LeaderboardCard
            title={t("watch_stat_cards.viewed_shows", "Most Viewed Shows")}
            unit={t("common.unit.plays", "Plays")}
            items={data.viewedShows}
            icon={Tv}
            loading={loadingStates.viewedShows}
          />
          <LeaderboardCard
            title={t("watch_stat_cards.popular_shows", "Most Popular Shows")}
            unit={t("common.unit.users", "Users")}
            items={data.popularShows}
            icon={Users}
            loading={loadingStates.popularShows}
          />
          <LeaderboardCard
            title={t("watch_stat_cards.viewed_libraries", "Most Viewed Libraries")}
            unit={t("common.unit.plays", "Plays")}
            items={data.libraries}
            icon={Library}
            loading={loadingStates.libraries}
          />
          <LeaderboardCard
            title={t("watch_stat_cards.used_clients", "Most Used Clients")}
            unit={t("common.unit.plays", "Plays")}
            items={data.clients}
            icon={MonitorPlay}
            loading={loadingStates.clients}
          />
          <LeaderboardCard
            title={t("watch_stat_cards.active_users", "Most Active Users")}
            unit={t("common.unit.plays", "Plays")}
            items={data.users}
            icon={Users}
            loading={loadingStates.users}
          />
          <LeaderboardCard
            title={t("watch_stat_cards.concurrent_streams", "Concurrent Streams")}
            unit={t("common.unit.streams", "Streams")}
            items={data.streams}
            icon={Activity}
            loading={loadingStates.streams}
          />
        </div>
      )}
    </div>
  );
}
