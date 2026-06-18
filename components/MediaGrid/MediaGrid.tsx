import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "next-i18next/pages";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";
import { 
  Search, 
  ArrowDownWideNarrow, 
  ArrowUpNarrowWide, 
  Loader2, 
  AlertCircle, 
  Film, 
  ChevronDown 
} from "lucide-react";

import client from "@/lib/api";
import type { ItemsWithStats } from "@/lib/models/itemsWithStats";
import ItemCard from "../ItemsCards/ItemCard";

type Props = {
  gridify?: GridifyQueryBuilder;
  defaultOrderBy?: string;
  defaultOrderDesc?: boolean;
  showSort?: boolean;
};

const MediaGrid: React.FC<Props> = ({ 
  gridify, 
  defaultOrderBy, 
  defaultOrderDesc, 
  showSort = true 
}) => {
  const { t } = useTranslation("common");

  // --- STATE ---
  const [items, setItems] = useState<ItemsWithStats[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState("");
  const [input, setInput] = useState("");
  const [sortField, setSortField] = useState<string>(defaultOrderBy ?? "dateCreated");
  const [sortDesc, setSortDesc] = useState<boolean>(defaultOrderDesc ?? true);
  const [archivedFilter, setArchivedFilter] = useState<boolean | null>(null);

  // --- REFS ---
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // --- DATA FETCHING ---
  const fetchPage = useCallback(
    async (pageToLoad: number, replace = false) => {
      setLoading(true);
      setError(null);
      try {
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();

        const query: GridifyQueryBuilder = gridify ? new GridifyQueryBuilder({ from: gridify }) : new GridifyQueryBuilder();
        query.setPage(pageToLoad);
        
        if (filter && filter.trim() !== "") {
          query.and().addCondition("Name", op.Contains, filter.trim(), false);
        }
        
        if (sortField) query.addOrderBy(sortField, sortDesc);
        
        if (archivedFilter !== null) {
          query.and().addCondition("Archived", op.Equal, archivedFilter.toString());
        }
        
        const builtQuery = query.build();

        const res = await client.Api.getLibraryItems(builtQuery);
        const data = res?.data ?? [];

        setItems((prev) => (replace ? data : [...prev, ...data]));
        setHasMore(data.length === builtQuery.pageSize);
        setPage(pageToLoad);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error(err);
        setError(err?.message ?? String(err));
      } finally {
        setLoading(false);
      }
    },
    [filter, gridify, sortDesc, sortField, archivedFilter]
  );

  // Initial load & when filter or sort changes
  useEffect(() => {
    setItems([]);
    setHasMore(true);
    setPage(1);
    fetchPage(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, sortField, sortDesc, archivedFilter]);

  // Debounce input -> set filter
  useEffect(() => {
    const t = setTimeout(() => {
      setFilter(input.trim());
    }, 300);
    return () => clearTimeout(t);
  }, [input]);

  // Infinite scroll using intersection observer
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !loading && hasMore) {
            fetchPage(page + 1);
          }
        }
      },
      { root: null, rootMargin: "200px", threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [fetchPage, hasMore, loading, page]);

  return (
    <div className="w-full animate-in fade-in duration-500">
      
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
        
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3 shrink-0">
          <Film className="text-brand-cyan" size={28} />
          {t("media_grid.title", "Media")}
        </h2>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          
          {/* Archived Filter */}
          <div className="relative group min-w-[140px]">
            <select
              value={archivedFilter === null ? "null" : archivedFilter ? "true" : "false"}
              onChange={(e) => {
                const v = e.target.value;
                setArchivedFilter(v === "true" ? true : v === "false" ? false : null);
              }}
              className="w-full bg-surface/80 border border-border hover:border-gray-500 rounded-xl py-2 pl-3 pr-8 text-sm font-bold text-gray-200 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan appearance-none transition-all cursor-pointer shadow-inner"
            >
              <option value="null">{t("media_grid.filter_all", "All Media")}</option>
              <option value="true">{t("media_grid.filter_archived", "Archived")}</option>
              <option value="false">{t("media_grid.filter_not_archived", "Active")}</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
              <ChevronDown size={14} />
            </div>
          </div>

          {/* Sort Controls */}
          {showSort && (
            <div className="flex items-center gap-2">
              <div className="relative group min-w-[140px]">
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value)}
                  className="w-full bg-surface/80 border border-border hover:border-gray-500 rounded-xl py-2 pl-3 pr-8 text-sm font-bold text-gray-200 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan appearance-none transition-all cursor-pointer shadow-inner"
                >
                  <option value="name">{t("media_grid.sort_title", "Title")}</option>
                  <option value="dateCreated">{t("media_grid.sort_date_added", "Date Added")}</option>
                  <option value="playCount">{t("media_grid.sort_views", "Views")}</option>
                  <option value="size">{t("media_grid.sort_size", "Size")}</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                  <ChevronDown size={14} />
                </div>
              </div>

              <button
                onClick={() => setSortDesc((s) => !s)}
                className="flex items-center justify-center p-2 rounded-xl bg-surface/80 border border-border hover:border-brand-cyan text-gray-400 hover:text-brand-cyan transition-colors shadow-inner focus:outline-none focus:ring-1 focus:ring-brand-cyan cursor-pointer"
                aria-label="Toggle Sort Direction"
              >
                {sortDesc ? <ArrowDownWideNarrow size={18} /> : <ArrowUpNarrowWide size={18} />}
              </button>
            </div>
          )}

          {/* Search Input */}
          <div className="relative group w-full sm:max-w-xs shrink-0 flex-1 sm:flex-none">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 group-focus-within:text-brand-cyan transition-colors">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder={t("media_grid.search_placeholder", "Search media...")}
              value={input}
              onChange={(e) => setInput(e.currentTarget.value)}
              className="w-full bg-background/50 border border-border hover:border-gray-500 rounded-xl py-2 pl-9 pr-4 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:border-brand-cyan focus:ring-brand-cyan transition-all shadow-inner"
            />
          </div>

        </div>
      </div>

      {/* Grid Container */}
      <div className="bg-surface/30 border border-border rounded-2xl p-4 md:p-6 shadow-xl shadow-black/20 min-h-[400px] flex flex-col relative">
        
        {/* Error Overlay */}
        {error && (
          <div className="p-4 mb-4 rounded-xl bg-brand-rose/10 border border-brand-rose/20 flex items-start gap-3">
            <AlertCircle size={18} className="text-brand-rose shrink-0 mt-0.5" />
            <p className="text-sm text-brand-rose/90 font-medium leading-relaxed">{error}</p>
          </div>
        )}

        {/* Media Items Grid */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
          {items.map((it: ItemsWithStats) => (
            <div key={`${it.serverId || ""}-${it.id}`} className="w-full">
              <ItemCard item={it} />
            </div>
          ))}
        </div>

        {/* Sentinel & Loading Status */}
        <div ref={sentinelRef} className="w-full h-20 flex items-center justify-center mt-4">
          {loading && <Loader2 size={32} className="text-brand-cyan animate-spin" />}
          
          {!loading && items.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center text-gray-500 opacity-60 absolute inset-0">
              <Search size={48} className="mb-4" />
              <span className="text-lg font-bold">{t("media_grid.no_results", "No results found")}</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default MediaGrid;