import { useEffect, useMemo, useState, useRef } from "react";
import { useTranslation } from "next-i18next/pages";
import { MoreVertical, Activity, Loader2, PlaySquare, Clock } from "lucide-react";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";

import client from "@/lib/api";
import StatType from "@/lib/models/enums/StatType";

type Props = {
  type: StatType;
  id: string;
};

const PERIODS = [
  { key: "1", tKey: "stats_card.last_24h", defaultLabel: "Last 24 Hours", days: 1 },
  { key: "7", tKey: "stats_card.last_7d", defaultLabel: "Last 7 Days", days: 7 },
  { key: "30", tKey: "stats_card.last_30d", defaultLabel: "Last 30 Days", days: 30 },
  { key: "180", tKey: "stats_card.last_180d", defaultLabel: "Last 180 Days", days: 180 },
  { key: "365", tKey: "stats_card.last_365d", defaultLabel: "Last 365 Days", days: 365 },
  { key: "0", tKey: "stats_card.all_time", defaultLabel: "All Time", days: 0 },
];

export default function StatsCard({ type, id }: Props) {
  const { t } = useTranslation("common");

  // --- DERIVED TITLE ---
  const title = (() => {
    switch (type) {
      case StatType.Library: return t("stats_card.library_stats", "Library Stats");
      case StatType.Item: return t("stats_card.item_stats", "Item Stats");
      case StatType.User: return t("stats_card.user_stats", "User Stats");
      default: return t("stats_card.stats_title", "Stats");
    }
  })();

  // --- STATE ---
  const defaultSelected = useMemo(() => new Set([1, 7, 30, 0]), []);
  const [selected, setSelected] = useState<Set<number>>(defaultSelected);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [loadingMap, setLoadingMap] = useState<Record<number, boolean>>({});
  const [statsMap, setStatsMap] = useState<Record<number, { plays: number; seconds: number }>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // --- DATA FETCHING ---
  useEffect(() => {
    let mounted = true;
    
    async function fetchFor(days: number) {
      setLoadingMap((m) => ({ ...m, [days]: true }));
      setError(null);
      
      try {
        let res: any = null;
        const query = new GridifyQueryBuilder().addCondition("Id", op.Equal, id).build();

        if (type === StatType.Library) {
          res = await client.Stats.getLibraryStats({ days }, query);
        } else if (type === StatType.Item) {
          res = await client.Stats.getItemStats({ days }, query);
        } else {
          res = await client.Stats.getUserStats({ days }, query);
        }

        const arr = res?.data ?? [];
        let plays = 0;
        let seconds = 0;
        
        for (const it of arr) {
          plays += Number(it.playCount ?? 0) || 0;
          seconds += Number(it.playDuration ?? 0) || 0;
        }

        if (!mounted) return;
        setStatsMap((m) => ({ ...m, [days]: { plays, seconds } }));
      } catch (er: any) {
        console.error("Stats fetch failed", er);
        if (!mounted) return;
        setError(er?.message ?? String(er));
      } finally {
        if (!mounted) return;
        setLoadingMap((m) => ({ ...m, [days]: false }));
      }
    }

    // Execute fetch for every selected timeframe
    for (const d of Array.from(selected.values())) {
      // Only fetch if we don't already have it loaded/loading to avoid infinite loops if selected changes
      if (statsMap[d] === undefined && !loadingMap[d]) {
        fetchFor(d);
      }
    }

    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, type, id]);

  // --- HANDLERS ---
  function toggleDays(days: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(days)) next.delete(days);
      else next.add(days);
      return next;
    });
  }

  // --- RENDER HELPERS ---
  const selectedPeriodsArray = PERIODS.filter(p => selected.has(p.days)).sort((a, b) => {
    if (a.days === 0) return 1;
    if (b.days === 0) return -1;
    return a.days - b.days;
  });

  return (
    <div className="w-full animate-in fade-in duration-500">
      
      {/* Header & Settings */}
      <div className="flex items-center justify-between mb-4 relative">
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
          <Activity className="text-brand-purple" size={28} />
          {title}
        </h2>

        <div ref={dropdownRef} className="relative">
          <button 
            onClick={() => setOpen((o) => !o)}
            className={`p-2 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-purple ${
              open ? "bg-surface border-brand-purple text-white shadow-inner" : "bg-transparent border-transparent text-gray-400 hover:text-white hover:bg-surface-hover"
            }`}
            aria-label="Toggle Stats Settings"
          >
            <MoreVertical size={20} />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-surface/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl z-50 p-3 flex flex-col gap-1.5 animate-in slide-in-from-top-2 zoom-in-95">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 px-2">
                {t("stats_card.timeframes", "Timeframes")}
              </span>
              {PERIODS.map((p) => {
                const isChecked = selected.has(p.days);
                return (
                  <label 
                    key={p.key} 
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-hover cursor-pointer transition-colors group"
                  >
                    <div onClick={() => toggleDays(p.days)} className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      isChecked ? "bg-brand-purple border-brand-purple" : "bg-background border-border group-hover:border-gray-500"
                    }`}>
                      {isChecked && <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                    </div>
                    <span className={`text-sm font-medium ${isChecked ? "text-white" : "text-gray-400 group-hover:text-gray-200"}`}>
                      {t(p.tKey, p.defaultLabel)}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 p-4 rounded-xl bg-brand-rose/10 border border-brand-rose/20 flex items-start gap-3">
          <p className="text-sm text-brand-rose/90 font-medium">{error}</p>
        </div>
      )}

      {/* Grid Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {selectedPeriodsArray.map((p) => {
          const stat = statsMap[p.days];
          const isLoading = loadingMap[p.days] !== false; // treat undefined as loading initially

          return (
            <div 
              key={p.key} 
              className="bg-surface/60 backdrop-blur-md border border-border rounded-2xl p-5 shadow-xl shadow-black/20 flex flex-col relative overflow-hidden group hover:border-brand-purple/40 transition-colors"
            >
              {/* Subtle ambient background glow */}
              <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-brand-cyan/10 blur-[40px] rounded-full pointer-events-none group-hover:bg-brand-purple/10 transition-colors duration-500"></div>

              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 relative z-10">
                {t(p.tKey, p.defaultLabel)}
              </span>

              {isLoading ? (
                <div className="flex-1 flex items-center justify-center py-4">
                  <Loader2 size={24} className="text-brand-purple animate-spin" />
                </div>
              ) : (
                <div className="flex flex-col gap-3 relative z-10">
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-cyan/10 rounded-lg text-brand-cyan border border-brand-cyan/20">
                      <PlaySquare size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-2xl font-black text-white leading-none">
                        {stat?.plays ?? 0}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-gray-500 mt-0.5">
                        {t("stats_card.plays", "Plays")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-purple/10 rounded-lg text-brand-purple border border-brand-purple/20">
                      <Clock size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-200 leading-none mt-1">
                        {stat?.seconds 
                          ? ((stat.seconds as any).secondsToDurationString?.() ?? `${stat.seconds} sec`) 
                          : t("stats_card.zero_seconds", "0 Seconds")
                        }
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-gray-500 mt-0.5">
                        {t("stats_card.duration", "Duration")}
                      </span>
                    </div>
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>
      
    </div>
  );
}