import { useEffect, useState, useRef } from "react";
import { useTranslation } from "next-i18next/pages";
import client from "@/lib/api";
import LibraryOverviewCard from "./LibraryOverviewCard";
import { Database, Loader2, AlertCircle } from "lucide-react";
import type { LibrariesWithStats } from "@/lib/models/librariesWithStats";

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
      if (!isCancelledRef.current) setLibraries(res?.data ?? []);
    } catch (err: any) {
      if (!isCancelledRef.current) setError(err?.message ?? t("library.failed_to_load", "Failed to load libraries"));
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
        <Database size={20} className="text-brand-purple mr-2" />
        <h2 className="text-xl font-black text-gray-200 tracking-tight">{t("library.overview_title", "Libraries")}</h2>
      </div>

      {/* Content Area */}
      <div className="flex flex-col gap-3">
        {loading && (
          <div className="w-full h-48 bg-surface/30 border border-border rounded-2xl flex flex-col items-center justify-center animate-pulse shadow-inner">
            <Loader2 size={24} className="text-brand-purple animate-spin mb-3" />
            <span className="text-xs text-gray-500 font-medium">{t("library.scanning", "Scanning libraries...")}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-brand-rose/10 border border-brand-rose/20 flex items-start gap-3">
            <AlertCircle size={18} className="text-brand-rose shrink-0 mt-0.5" />
            <p className="text-sm text-brand-rose/90 font-medium">{error}</p>
          </div>
        )}

        {!loading && !error && libraries.length > 0 && libraries.map((lib) => <LibraryOverviewCard key={lib.id} library={lib} />)}

        {!loading && !error && libraries.length === 0 && (
          <div className="w-full h-32 bg-surface/30 border border-border border-dashed rounded-2xl flex flex-col items-center justify-center text-gray-500 shadow-inner">
            <span className="font-medium text-sm">{t("library.no_libraries", "No libraries found")}</span>
          </div>
        )}
      </div>
    </div>
  );
}
