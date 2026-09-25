import { useEffect, useState } from "react";
import Head from "next/head";
import { useTranslation } from "react-i18next";
import { Database, Loader2, AlertCircle } from "lucide-react";

import client from "@/lib/api";
import type { LibrariesWithStats } from "@/lib/models/librariesWithStats";
import LibraryCard from "@/components/LibraryCard/LibraryCard";
import { GridifyQueryBuilder } from "gridify-client";

export default function LibrariesPage() {
  const { t } = useTranslation("common");
  const [libs, setLibs] = useState<LibrariesWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const query = new GridifyQueryBuilder().addOrderBy("name").build();
        const res = await client.Api.getLibraries(query);
        if (!mounted) return;
        setLibs(res?.data ?? []);
      } catch (er: any) {
        console.error("Failed to load libraries", er);
        if (!mounted) return;
        setError(er?.message ?? String(er));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <Head>
        <title>{t("nav.libraries", "Libraries")} | Jellystat</title>
      </Head>

      <div className="space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12">
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-border/50 pb-6">
          <div className="p-3.5 bg-brand-cyan/10 rounded-2xl border border-brand-cyan/20 shadow-inner">
            <Database size={28} className="text-brand-cyan" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">{t("nav.libraries", "Libraries")}</h1>
            <p className="text-sm text-gray-400 mt-1 font-medium">
              {t("libraries.libraries_desc", "Manage, track, and analyze your media collections")}
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="w-full py-32 flex flex-col items-center justify-center">
            <Loader2 size={48} className="text-brand-cyan animate-spin mb-4" />
            <span className="text-gray-400 font-medium tracking-wide">{t("common.loading", "Loading")}</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-5 rounded-2xl bg-brand-rose/10 border border-brand-rose/20 flex items-start gap-4 shadow-xl shadow-brand-rose/5">
            <AlertCircle size={24} className="text-brand-rose shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-brand-rose mb-1">{t("libraries.failed_load", "Failed to load libraries")}</h3>
              <p className="text-sm text-brand-rose/80 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && libs.length === 0 && (
          <div className="w-full py-24 bg-surface/30 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-gray-500">
            <Database size={48} className="mb-4 opacity-20" />
            <span className="font-bold text-lg tracking-wide text-gray-400">
              {t("common.no_libraries_found", "No libraries found")}
            </span>
            <span className="text-sm mt-1">{t("common.no_libraries_found", "No libraries found")}</span>
          </div>
        )}

        {/* Library Grid */}
        {!loading && !error && libs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 xl:gap-8">
            {libs.map((l) => (
              <LibraryCard key={`${l.serverId}-${l.id}`} lib={l} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
