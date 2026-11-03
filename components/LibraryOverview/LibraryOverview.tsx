import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import client from "@/lib/api";
import LibraryOverviewCard from "./LibraryOverviewCard";
import { Database, AlertCircle } from "lucide-react";
import type { LibrariesWithStats } from "@/lib/models/librariesWithStats";
import { Spinner } from "@/components/ui";

export default function LibraryOverview() {
  const { t } = useTranslation("common");

  const [libraries, setLibraries] = useState<LibrariesWithStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isCancelledRef = useRef(false);

  const fetchLibraries = async () => {
    isCancelledRef.current = false;
    setLoading(true);
    setError(null);
    try {
      const res = await client.Api.getLibraries();
      if (!isCancelledRef.current) {
        setLibraries(res?.data ?? []);
        console.log("Fetched libraries:", res?.data ?? []);
      }
    } catch (err: any) {
      if (!isCancelledRef.current) setError(err?.message ?? t("error_cards.failed_to_load_desc", "Failed to load data"));
    } finally {
      if (!isCancelledRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibraries();
    return () => {
      isCancelledRef.current = true;
    };
  }, []);

  return (
    <div className="flex flex-col w-full h-full animate-in fade-in duration-500">
      {/* Section Header */}
      <div className="flex items-center mb-4">
        <Database size={20} className="text-primary mr-2" />
        <h2 className="text-xl font-bold text-white tracking-tight">{t("library.overview_title", "Libraries")}</h2>
      </div>

      {/* Content Area */}
      <div className="flex flex-col gap-3">
        {loading && (
          <div className="w-full h-48 bg-surface/30 border border-border rounded-2xl flex flex-col items-center justify-center animate-pulse motion-reduce:animate-none shadow-inner">
            <Spinner size={24} className="text-primary mb-3" />
            <span className="text-xs text-gray-500 font-medium">{t("library.scanning", "Scanning libraries...")}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 flex items-start gap-3">
            <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" />
            <p className="text-sm text-danger/90 font-medium">{error}</p>
          </div>
        )}

        {!loading && !error && libraries.length > 0 && libraries.map((lib) => <LibraryOverviewCard key={lib.id} library={lib} />)}

        {!loading && !error && libraries.length === 0 && (
          <div className="w-full h-32 bg-surface/30 border border-border border-dashed rounded-2xl flex flex-col items-center justify-center text-gray-500 shadow-inner">
            <span className="font-medium text-sm">{t("common.no_libraries_found", "No libraries found")}</span>
          </div>
        )}
      </div>
    </div>
  );
}
