import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { GridifyQueryBuilder } from "gridify-client";
import { Loader2, AlertCircle, Image as ImageIcon, Info, Film, Activity as ActivityIcon, Settings } from "lucide-react";

import client from "@/lib/api";
import type { LibrariesWithStats } from "@/lib/models/librariesWithStats";
import LibraryTypeIcons from "@/lib/declarations/libraryIcons";

import LibraryOverView from "./overview";
import LibraryMedia from "./media";
import LibraryActivity from "./activity";
import NotFound from "@/components/ErrorCards/NotFound";

export default function LibraryPage() {
  const router = useRouter();
  const { LibraryId } = router.query;
  const { t } = useTranslation("common");

  // --- STATE ---
  const [lib, setLib] = useState<LibrariesWithStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("overview");

  // --- DATA FETCHING ---
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!LibraryId || Array.isArray(LibraryId)) return;
      setLoading(true);
      setError(null);
      try {
        // Load libraries and find the matching one
        const libsRes = await client.Api.getLibraries(new GridifyQueryBuilder().addOrderBy("name").build());
        const found = libsRes?.data?.find((l) => l.id === LibraryId) ?? null;
        if (!mounted) return;
        setLib(found);
      } catch (er: any) {
        console.error(er);
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
  }, [LibraryId]);

  if (!lib && !loading && !error) {
    return (
      <NotFound
        title={t("library.not_found_title", "Library not found")}
        message={t("library.not_found_message", "Library with id {{id}} could not be found", { id: LibraryId as string })}
      />
    );
  }

  const tabs = [
    { id: "overview", label: t("library.tab_overview", "Overview"), icon: Info },
    { id: "media", label: t("library.tab_media", "Media"), icon: Film },
    { id: "activity", label: t("library.tab_activity", "Activity"), icon: ActivityIcon },
    { id: "options", label: t("library.tab_options", "Options"), icon: Settings },
  ];

  const LibraryIcon = LibraryTypeIcons[lib?.type ?? ""] ?? ImageIcon;

  return (
    <>
      <Head>
        <title>{lib?.name || t("common.loading", "Loading")} | Jellystat</title>
      </Head>

      <div className="w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 animate-in fade-in duration-500 pb-20">
        {loading && (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 size={40} className="text-brand-cyan animate-spin mb-4" />
          </div>
        )}

        {error && (
          <div className="p-6 rounded-2xl bg-brand-rose/10 border border-brand-rose/20 flex flex-col items-center justify-center text-center max-w-lg mx-auto mt-12">
            <AlertCircle size={40} className="text-brand-rose mb-3" />
            <span className="text-xl font-bold text-white mb-2">{t("library.error_loading", "Error loading library")}</span>
            <span className="text-sm text-gray-400">{error}</span>
          </div>
        )}

        {!loading && !error && lib && (
          <div className="flex flex-col gap-6">
            {/* Header Block */}
            <div className="bg-surface/60 backdrop-blur-xl border border-border rounded-3xl p-6 shadow-xl shadow-black/20 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden">
              {/* Ambient Glow */}
              <div className="absolute top-[-50%] left-[-10%] w-[40%] h-[200%] bg-brand-cyan/5 blur-[80px] pointer-events-none rounded-full"></div>

              {/* Icon Container */}
              <div className="relative w-24 h-24 rounded-2xl bg-background border border-border flex items-center justify-center shadow-inner shrink-0 group">
                <LibraryIcon size={48} className="text-gray-400 group-hover:text-brand-cyan transition-colors duration-300" />
              </div>

              {/* Title & Tabs Container */}
              <div className="flex flex-col flex-1 w-full items-center sm:items-start">
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-6 text-center sm:text-left drop-shadow-md">
                  {lib.name ?? LibraryId}
                </h1>

                {/* Horizontal Scrollable Tabs */}
                <div className="flex overflow-x-auto custom-scrollbar w-full sm:w-auto">
                  <div className="flex items-center p-1.5 bg-background/50 border border-border rounded-2xl shadow-inner w-max">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;

                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 group ${
                            isActive
                              ? "bg-brand-cyan text-black shadow-md shadow-brand-cyan/20"
                              : "text-gray-400 hover:text-white hover:bg-surface-hover"
                          }`}
                        >
                          <Icon
                            size={16}
                            className={`transition-colors ${isActive ? "text-black" : "text-gray-500 group-hover:text-gray-300"}`}
                          />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Panels Container */}
            <div className="relative w-full">
              <div className={activeTab === "overview" ? "block animate-in fade-in slide-in-from-bottom-2" : "hidden"}>
                <LibraryOverView library={lib} />
              </div>

              <div className={activeTab === "media" ? "block animate-in fade-in slide-in-from-bottom-2" : "hidden"}>
                <LibraryMedia library={lib} />
              </div>

              <div className={activeTab === "activity" ? "block animate-in fade-in slide-in-from-bottom-2" : "hidden"}>
                <LibraryActivity library={lib} />
              </div>

              <div className={activeTab === "options" ? "block animate-in fade-in slide-in-from-bottom-2" : "hidden"}>
                <div className="bg-surface/30 border-2 border-dashed border-border rounded-3xl p-16 flex flex-col items-center justify-center text-center mt-4">
                  <Settings size={48} className="text-gray-500 opacity-30 mb-4 animate-[spin_10s_linear_infinite]" />
                  <h3 className="text-2xl font-black text-gray-300 tracking-tight">{t("library.options_title", "Options")}</h3>
                  <p className="mt-2 text-sm text-gray-500 font-medium max-w-sm">
                    {t("library.options_desc", "Library options and settings go here.")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export async function getServerSideProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale || "en", ["common"])),
    },
  };
}
