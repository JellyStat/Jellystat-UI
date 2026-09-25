import { act, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { useTranslation } from "next-i18next/pages";
import { GridifyQueryBuilder } from "gridify-client";
import {
  ExternalLink,
  Lock,
  Loader2,
  AlertCircle,
  Info,
  Film,
  Activity as ActivityIcon,
  ChevronLeft,
  Settings,
} from "lucide-react";

import client from "@/lib/api";
import { ItemsWithStats } from "@/lib/models/itemsWithStats";
import { Server } from "@/lib/models/server";
import configManager from "@/lib/configManager";
import ItemTypes from "@/lib/models/enums/ItemTypes";

import ItemOverview from "./overview";
import ItemActivity from "./activity";
import ItemMedia from "./media";
import NotFound from "@/components/ErrorCards/NotFound";
import ItemImage from "@/components/ItemImage/ItemImage";
import Link from "next/link";
import ItemOptions from "./options";

export default function ItemPage() {
  const router = useRouter();
  const { ItemId } = router.query;
  const { t } = useTranslation("common");

  const [item, setItem] = useState<ItemsWithStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>(localStorage.getItem("PREF_ITEM_TAB") ?? "overview");

  const [config, setConfig] = useState<Server | null>(null);

  const setAndStoreActiveTab = (tab: string) => {
    setActiveTab(tab);
    localStorage.setItem("PREF_ITEM_TAB", tab);
    // You can add additional logic here to store the active tab in local storage or elsewhere if needed
  };

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!ItemId || Array.isArray(ItemId)) return;
      setLoading(true);
      setError(null);
      try {
        const res = await client.Api.getLibraryItems(new GridifyQueryBuilder().addCondition("Id", "=", ItemId as string).build());
        if (!mounted) return;
        const found = (res?.data && res.data.length > 0 && res.data[0]) || null;
        setItem(found);

        const activeConfig = await configManager.getActiveConfig();
        setConfig(activeConfig);
      } catch (er: any) {
        console.error(er);
        if (!mounted) return;
        setError(er?.message ?? String(er));
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [ItemId]);

  if (!item && !loading && !error) {
    return (
      <NotFound
        title={t("item.not_found_title", "Item not found")}
        message={t("item.not_found_message", "The requested media item could not be found.")}
      />
    );
  }

  // Derived Properties
  const externalURLBase = config?.externalURL && config?.externalURL.trim().length > 0 ? config.externalURL : config?.url;
  const isValidParent = item && item.parent && item.parent.id && item.parent.id !== item.id && item.parent.name;

  const title = isValidParent ? item?.parent?.name : item?.name;
  const subtitle = isValidParent ? item?.name : null;

  const parentIndexUnit = isValidParent && item.type === ItemTypes.Episode ? t("item.season", "Season") : null;
  const indexUnit = item?.type === ItemTypes.Episode ? t("item.episode", "Episode") : null;

  const imageUrl = `${client.API_BASE}/Proxy/Images/Items/Primary?Id=${encodeURIComponent(item?.parent?.id ?? item?.id ?? "")}&Width=600&ServerId=${encodeURIComponent(item?.serverId ?? "")}`;
  const backgroundImage = `${client.API_BASE}/Proxy/Images/Items/Backdrop?Id=${encodeURIComponent(item?.parent?.id ?? item?.id ?? "")}&Width=1920&Quality=90&ServerId=${encodeURIComponent(item?.serverId ?? "")}`;

  // Tabs Configuration
  const showMediaTab = item && [ItemTypes.Season, ItemTypes.Series].includes(item.type);

  if (item && !showMediaTab && activeTab === "media") {
    setAndStoreActiveTab("overview");
  }

  const showOptionsTab = item && (item.archived === true || item.hasArchivedItems === true);

  if (item && !showOptionsTab && activeTab === "options") {
    setAndStoreActiveTab("overview");
  }

  const tabs = [
    { id: "overview", label: t("item.tab_overview", "Overview"), icon: Info },
    ...(showMediaTab ? [{ id: "media", label: t("item.tab_media", "Media"), icon: Film }] : []),
    { id: "activity", label: t("item.tab_activity", "Activity"), icon: ActivityIcon },
    ...(showOptionsTab ? [{ id: "options", label: t("common.tab_options", "Options"), icon: Settings }] : []),
  ];

  return (
    <>
      <Head>
        <title>{title || t("common.loading", "Loading")} | Jellystat</title>
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
            <span className="text-xl font-bold text-white mb-2">{t("item.error_loading", "Error loading item")}</span>
            <span className="text-sm text-gray-400">{error}</span>
          </div>
        )}

        {!loading && !error && item && (
          <div className="flex flex-col gap-8">
            {/* Header Backdrop Card */}
            <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl shadow-black/40 border border-border/50 bg-surface">
              {/* CSS Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-screen"
                style={{ backgroundImage: `url('${backgroundImage}')` }}
              />

              {/* Gradient Overlay to ensure text readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-transparent backdrop-blur-[2px]" />

              {/* Header Content */}
              <div className="relative z-10 p-6 md:p-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
                {/* Poster Image */}
                <div className="shrink-0 relative group">
                  <ItemImage
                    imageUrl={imageUrl}
                    imageHash={item.imageHash}
                    archived={item.archived}
                    width={200}
                    height={300}
                    borderRadius={[16, 16, 16, 16]}
                  />
                </div>

                {/* Details */}
                <div className="flex flex-col flex-1 items-start">
                  <button
                    onClick={() => router.push(`/libraries/${item.libraryId}`)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan hover:text-black border border-brand-cyan/20 transition-colors text-xs font-black uppercase tracking-widest mb-4 cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                    {item.library?.name || t("item.library", "Library")}
                  </button>

                  <div className="flex items-start gap-4 mb-2">
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-md">
                      {item.parentId ? (
                        <Link href={`/libraries/items/${item.parentId}`} className="hover:text-brand-cyan transition-colors">
                          {title}
                        </Link>
                      ) : (
                        title
                      )}
                    </h1>

                    {config && (
                      <a
                        href={`${externalURLBase}/web/index.html#/details?id=${item.id}&serverId=${item.serverId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 p-2 bg-surface/50 hover:bg-brand-cyan text-gray-300 hover:text-black border border-border hover:border-brand-cyan rounded-xl transition-all shadow-inner"
                        title={t("item.open_in_server", "Open in Media Server")}
                      >
                        <ExternalLink size={20} />
                      </a>
                    )}
                  </div>

                  {isValidParent && (
                    <div className="flex flex-wrap items-center gap-2 text-lg font-bold text-gray-300 mb-4 drop-shadow">
                      {parentIndexUnit && (
                        <Link href={`/libraries/items/${item.parentId}`} className="hover:text-brand-purple transition-colors">
                          {parentIndexUnit} {item.parentIndex}
                        </Link>
                      )}
                      {indexUnit && (
                        <span>
                          {indexUnit} {item.index}
                        </span>
                      )}
                      {(parentIndexUnit || indexUnit) && subtitle && <span className="text-gray-500 mx-1">•</span>}
                      {subtitle && <span className="text-gray-400 font-medium">{subtitle}</span>}
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5 mt-2">
                    {item.path && (
                      <p className="text-xs font-mono text-gray-500 truncate max-w-2xl" title={item.path}>
                        <span className="font-bold text-gray-400 mr-2">{t("item.file_path", "File Path:")}</span>
                        {item.path}
                      </p>
                    )}

                    <div className="flex items-center gap-6 mt-1">
                      {item.duration != undefined && (
                        <p className="text-xs font-mono text-gray-400">
                          <span className="font-bold mr-2 uppercase tracking-wider">{t("item.runtime", "Runtime:")}</span>
                          <span className="text-gray-200">{item.duration.ticksToDurationString?.() || "-"}</span>
                        </p>
                      )}
                      {item.size != undefined && (
                        <p className="text-xs font-mono text-gray-400">
                          <span className="font-bold mr-2 uppercase tracking-wider">{t("item.size", "Size:")}</span>
                          <span className="text-gray-200">{item.size.formatBytes?.() || "-"}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Tabs */}
            <div className="flex flex-col w-full">
              {/* Glassmorphic Tab Container */}
              <div className="flex overflow-x-auto custom-scrollbar mb-6">
                <div className="flex items-center p-1.5 bg-surface/60 backdrop-blur-xl border border-border rounded-2xl shadow-inner w-max">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                      <button
                        key={tab.id}
                        onClick={() => setAndStoreActiveTab(tab.id)}
                        className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 group ${
                          isActive
                            ? "bg-brand-cyan text-black shadow-md shadow-brand-cyan/20"
                            : "text-gray-400 hover:text-white hover:bg-surface-hover"
                        }`}
                      >
                        <Icon
                          size={18}
                          className={`transition-colors ${isActive ? "text-black" : "text-gray-500 group-hover:text-gray-300"}`}
                        />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab Panels */}
              <div className="relative w-full">
                <div className={activeTab === "overview" ? "block animate-in fade-in slide-in-from-bottom-2" : "hidden"}>
                  <ItemOverview item={item} />
                </div>

                {showMediaTab && (
                  <div className={activeTab === "media" ? "block animate-in fade-in slide-in-from-bottom-2" : "hidden"}>
                    <ItemMedia item={item} />
                  </div>
                )}

                <div className={activeTab === "activity" ? "block animate-in fade-in slide-in-from-bottom-2" : "hidden"}>
                  <ItemActivity item={item} />
                </div>

                {showOptionsTab && (
                  <div className={activeTab === "options" ? "block animate-in fade-in slide-in-from-bottom-2" : "hidden"}>
                    <ItemOptions item={item} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Note: This page is client-side rendered only to support `next export`.
