import React, { useCallback, useEffect, useState } from "react";
import { Library, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { GridifyQueryBuilder } from "gridify-client";
import { useTranslation } from "next-i18next/pages";

import client from "@/lib/api";
import { TrackedLibraries } from "@/lib/models/trackedLibraries";
import LibraryTrackingCard from "@/components/LibraryCard/LibraryTrackingCard";

export default function LibrarySettingsPage() {
  const { t } = useTranslation("common");

  // --- STATE ---
  const [libraryData, setLibraryData] = useState<TrackedLibraries[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- ACTIONS ---
  function toggleLibraryTracking(libraryId: string, tracked: boolean) {
    const targetLibrary = libraryData.find((l) => l.id === libraryId);
    if (!targetLibrary) return;

    // UI Update
    targetLibrary.tracked = tracked;
    setLibraryData((prev) =>
      prev.map((l) => (l.id === libraryId ? targetLibrary : l))
    );

    client.Api.trackedLibraries.post([targetLibrary]).catch((err) => {
      // Revert update on failure
      setLibraryData((prev) =>
        prev.map((l) => {
          if (l.id === libraryId) return { ...l, tracked: !tracked };
          return l;
        })
      );
      toast.error(
        t("settings.toast_tracking_failed", "Failed to update tracking for {{name}}: {{error}}", {
          name: targetLibrary.name,
          error: err?.message ?? String(err),
        })
      );
    });
  }

  // --- DATA FETCHING ---
  const fetchPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new GridifyQueryBuilder();
      const builtQuery = query.build();

      const res = await client.Api.trackedLibraries.get(builtQuery);
      setLibraryData(res?.data ?? []);
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      console.error(err);
      setError(err?.message ?? t("settings.error_load_libraries", "Failed to load libraries"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12 p-6">
      
      {/* Header Container */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/50 pb-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-brand-emerald/10 rounded-2xl border border-brand-emerald/20 shadow-inner shrink-0">
            <Library size={28} className="text-brand-emerald" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              {t("settings.library_title", "Library Settings")}
            </h1>
            <p className="text-sm text-gray-400 mt-1 font-medium">
              {t("settings.library_subtitle", "Select which media libraries you want to track statistics for.")}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative min-h-[400px]">
        
        {/* Loading State */}
        {loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center animate-in fade-in">
            <Loader2 size={48} className="text-brand-emerald animate-spin mb-4" />
            <span className="text-sm font-bold text-gray-300 tracking-wide">
              {t("settings.syncing_libraries", "Syncing libraries...")}
            </span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-surface/90 backdrop-blur-md border border-brand-rose/20 rounded-2xl p-8 flex flex-col items-center justify-center animate-in fade-in max-w-lg mx-auto mt-12 shadow-2xl">
            <AlertCircle size={48} className="text-brand-rose mb-4" />
            <span className="text-xl font-black text-white mb-2">
              {t("settings.sync_failed", "Sync Failed")}
            </span>
            <span className="text-sm text-gray-400 text-center">{error}</span>
            <button 
              onClick={fetchPage}
              className="mt-6 px-6 py-2.5 bg-surface border border-border hover:border-brand-emerald hover:text-brand-emerald rounded-xl font-bold transition-all shadow-inner"
            >
              {t("settings.retry_connection", "Retry Connection")}
            </button>
          </div>
        )}

        {/* Library Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {libraryData.length === 0 ? (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-500">
                <Library size={64} className="mb-4 opacity-20" />
                <span className="text-xl font-bold text-gray-400">
                  {t("settings.no_libraries_found", "No libraries found")}
                </span>
                <span className="text-sm mt-1">
                  {t("settings.no_libraries_desc", "Make sure your media server is connected properly.")}
                </span>
              </div>
            ) : (
              libraryData.map((lib) => (
                <LibraryTrackingCard 
                  key={`${lib.serverId}-${lib.id}`} 
                  lib={lib} 
                  toggleLibraryTracking={toggleLibraryTracking} 
                />
              ))
            )}
          </div>
        )}
      </div>

    </div>
  );
}