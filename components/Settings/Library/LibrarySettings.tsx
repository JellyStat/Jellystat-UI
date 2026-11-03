import React, { useCallback, useEffect, useState } from "react";
import { Library, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { GridifyQueryBuilder } from "gridify-client";
import { useTranslation } from "react-i18next";

import client from "@/lib/api";
import { TrackedLibraries } from "@/lib/models/trackedLibraries";
import LibraryTrackingCard from "@/components/LibraryCard/LibraryTrackingCard";
import { Button, Card, EmptyState, Page, PageHeader, Spinner } from "@/components/ui";

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
    setLibraryData((prev) => prev.map((l) => (l.id === libraryId ? targetLibrary : l)));

    client.Api.trackedLibraries.post([targetLibrary]).catch((err) => {
      // Revert update on failure
      setLibraryData((prev) =>
        prev.map((l) => {
          if (l.id === libraryId) return { ...l, tracked: !tracked };
          return l;
        }),
      );
      toast.error(
        t("settings.toast_tracking_failed", "Failed to update tracking for {{name}}: {{error}}", {
          name: targetLibrary.name,
          error: err?.message ?? String(err),
        }),
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
    <Page className="pt-4 sm:px-6 sm:pt-6">
      <PageHeader
        iconTone="success"
        icon={<Library size={28} />}
        title={t("settings.library_title", "Library Settings")}
        description={t("settings.library_subtitle", "Select which media libraries you want to track statistics for.")}
      />

      <div className="relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 animate-in fade-in">
            <Spinner size={48} tone="primary" />
            <span className="text-sm font-bold text-gray-300">{t("common.loading", "Loading")}</span>
          </div>
        )}

        {error && !loading && (
          <Card className="max-w-lg mx-auto mt-12 flex flex-col items-center text-center animate-in fade-in">
            <AlertCircle size={48} className="text-danger mb-4" />
            <span className="text-lg font-bold text-white mb-2">{t("libraries.failed_load", "Failed to load libraries")}</span>
            <span className="text-sm text-gray-400">{error}</span>
            <Button variant="outline" onClick={fetchPage} className="mt-6">
              {t("common.try_again", "Try again")}
            </Button>
          </Card>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {libraryData.length === 0 ? (
              <EmptyState
                className="col-span-full"
                bordered={false}
                Icon={Library}
                title={t("common.no_libraries_found", "No libraries found")}
                message={t("settings.no_libraries_desc", "Make sure your media server is connected properly.")}
              />
            ) : (
              libraryData.map((lib) => (
                <LibraryTrackingCard key={`${lib.serverId}-${lib.id}`} lib={lib} toggleLibraryTracking={toggleLibraryTracking} />
              ))
            )}
          </div>
        )}
      </div>
    </Page>
  );
}
