import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";
import {
  Search,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Loader2,
  AlertCircle,
  Film,
  ChevronDown,
  ArchiveIcon,
} from "lucide-react";

import client from "@/lib/api";
import type { ItemsWithStats } from "@/lib/models/itemsWithStats";
import ItemCard from "../ItemsCards/ItemCard";
import { useDebounce } from "@/lib/hooks/useDebounce";
import DropdownSelector from "../Core/DropdownSelector";

type Props = {
  gridify?: GridifyQueryBuilder;
  defaultOrderBy?: string;
  defaultOrderDesc?: boolean;
  showSort?: boolean;
};

const MediaGrid: React.FC<Props> = ({ gridify, defaultOrderBy, defaultOrderDesc, showSort = true }) => {
  const { t } = useTranslation("common");

  // --- STATE ---
  const [items, setItems] = useState<ItemsWithStats[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [input, setInput] = useState("");
  const debounced = useDebounce(input, 500);
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

        if (debounced && debounced.trim() !== "") {
          query.and().addCondition("Name", op.Contains, debounced.trim(), false);
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
    [debounced, gridify, sortDesc, sortField, archivedFilter],
  );

  // Initial load & when filter or sort changes
  useEffect(() => {
    setItems([]);
    setHasMore(true);
    setPage(1);
    fetchPage(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, sortField, sortDesc, archivedFilter]);

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
          {t("common.media", "Media")}
        </h2>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
          {/* Archived Filter */}

          <DropdownSelector
            data={[{ value: "null" }, { value: "true" }, { value: "false" }]}
            value={archivedFilter === null ? "null" : archivedFilter ? "true" : "false"}
            onChange={(val) => setArchivedFilter(val === "true" ? true : val === "false" ? false : null)}
            labelFn={(val) => {
              if (val === "null") return t("media_grid.filter_all", "All Media");
              if (val === "true") return t("media_grid.filter_archived", "Archived");
              if (val === "false") return t("media_grid.filter_not_archived", "Active");
              return "";
            }}
            disabled={loading}
          />

          {/* Sort Controls */}
          {showSort && (
            <div className="flex items-center gap-2">
              <DropdownSelector
                data={[{ value: "name" }, { value: "dateCreated" }, { value: "playCount" }, { value: "size" }]}
                value={sortField}
                onChange={(val) => setSortField(val)}
                labelFn={(val) => {
                  if (val === "name") return t("common.title", "Title");
                  if (val === "dateCreated") return t("media_grid.sort_date_added", "Date Added");
                  if (val === "playCount") return t("media_grid.sort_views", "Views");
                  if (val === "size") return t("media_grid.sort_size", "Size");
                  return "";
                }}
                disabled={loading}
              />

              <button
                onClick={() => setSortDesc((s) => !s)}
                className="flex items-center justify-center p-2 py-2.5 rounded-xl bg-surface/80 border border-border hover:border-gray-500 text-gray-400 transition-colors shadow-inner focus:outline-none cursor-pointer"
                aria-label="Toggle Sort Direction"
              >
                {sortDesc ? <ArrowDownWideNarrow size={18} /> : <ArrowUpNarrowWide size={18} />}
              </button>
            </div>
          )}

          {/* Search Input */}
          <div className="relative group w-full sm:max-w-xs shrink-0 flex-1 sm:flex-none">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 transition-colors">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder={t("media_grid.search_placeholder", "Search media...")}
              value={input}
              onChange={(e) => setInput(e.currentTarget.value)}
              className="w-full bg-background/50 border border-border hover:border-gray-500 rounded-xl py-2 pl-9 pr-4 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none transition-all shadow-inner"
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
        <div className="grid auto-rows-fr grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
          {items.map((it: ItemsWithStats) => (
            <div key={`${it.serverId || ""}-${it.id}`} className="w-full h-full">
              <ItemCard item={it} width="100%" />
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
