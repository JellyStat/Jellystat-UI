import { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import {
  Settings,
  Library,
  ArrowLeftRight,
  Terminal,
  Server,
  Users,
  Archive,
  Info,
  RefreshCw,
  Check,
  AlertCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import ActivityMigrationPage from "./ActivityMigration/ActivityMigration";
import TasksPage from "./Tasks/Tasks";
import LibrarySettingsPage from "./Library/LibrarySettings";
import ServerSettingsPage from "./Servers/ServerSettings";
import UsersSettingsPage from "./Users";
import BackupsPage from "./Backups/BackupsPage";
import LanguageSwitcher from "@/components/Core/LanguageSwitcher";
import { VersionInfo } from "@/lib/models/VersionInfo";
import versionManager from "@/lib/versionManager";
import client from "@/lib/api";

export default function SettingsPage() {
  const { t } = useTranslation("common");
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [isUpdatingUI, setIsUpdatingUI] = useState(false);

  const fetchVersionInfo = useCallback(async () => {
    try {
      const data = await versionManager.getInfo(true);
      setVersionInfo(data ?? null);
    } catch (err: any) {
      console.error(err);
    }
  }, [t]);

  useEffect(() => {
    fetchVersionInfo();
  }, [fetchVersionInfo]);

  const [activeTab, setActiveTab] = useState<string>(localStorage.getItem("PREF_SETTINGS_TAB") ?? "settings");

  const setAndStoreActiveTab = (tab: string) => {
    setActiveTab(tab);
    localStorage.setItem("PREF_SETTINGS_TAB", tab);
    // You can add additional logic here to store the active tab in local storage or elsewhere if needed
  };

  const tabs = [
    { id: "settings", label: t("settings.tab_general", "General Settings"), icon: Settings },
    { id: "servers", label: t("settings.tab_servers", "Servers & Auth"), icon: Server },
    { id: "users", label: t("nav.users", "Users"), icon: Users },
    { id: "librarySettings", label: t("settings.tab_library", "Library Settings"), icon: Library },
    { id: "migrations", label: t("settings.tab_migrations", "Activity Migration"), icon: ArrowLeftRight },
    { id: "backups", label: t("settings.tab_backups", "Backups"), icon: Archive },
    { id: "tasks", label: t("settings.tab_tasks", "Background Tasks"), icon: Terminal },
  ];

  const updateUI = useCallback(async () => {
    try {
      setIsUpdatingUI(true);
      await client.Api.updateUI();
      await fetchVersionInfo();
      //reload page
      window.location.reload();
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsUpdatingUI(false);
    }
  }, [fetchVersionInfo]);

  return (
    <>
      <Head>
        <title>{t("nav.settings", "Settings")} | Jellystat</title>
      </Head>

      <div className="w-full min-h-screen">
        {/* Top Navigation Bar */}
        <div className="max-w-[1600px] mx-auto px-6 pt-6 animate-in slide-in-from-top-4 duration-500">
          <div className="flex overflow-x-auto custom-scrollbar pb-4">
            {/* Glassmorphic Tab Container */}
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
        </div>

        {/* Active Tab Panel */}
        <div className="w-full transition-opacity duration-300">
          {activeTab === "settings" && (
            <div className="max-w-[1600px] mx-auto p-6 animate-in fade-in duration-500 flex flex-col gap-3">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <Settings size={24} className="text-brand-cyan" />
                  <h3 className="text-xl font-black text-gray-200 tracking-tight">
                    {t("settings.general_title", "General Settings")}
                  </h3>
                </div>
                <div className="flex items-center justify-between p-4 bg-surface-hover/50 rounded-2xl border border-border">
                  <div>
                    <h4 className="text-sm font-bold text-gray-200">{t("settings.language", "Language")}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {t("settings.language_desc", "Select your preferred display language")}
                    </p>
                  </div>
                  <LanguageSwitcher />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Info size={24} className="text-brand-cyan" />
                  <h3 className="text-xl font-black text-gray-200 tracking-tight">
                    {t("settings.version_title", "Version Info")}
                  </h3>
                </div>
                <div className="overflow-x-auto rounded-2xl border border-border bg-surface-hover/50">
                  <table className="w-full table-fixed text-left">
                    <colgroup>
                      <col />
                      <col className="w-30" />
                      <col className="w-40" />
                    </colgroup>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="p-4 text-sm font-bold text-gray-200">{t("settings.version", "Version")}</td>
                        <td className="p-4 text-sm text-gray-200">{versionInfo?.apiVersion ?? "-"}</td>
                        <td className="whitespace-nowrap p-4">
                          {!versionInfo ? (
                            <span className="text-sm text-gray-500">-</span>
                          ) : versionInfo.uiHasUpdate ? (
                            <span
                              title={t("settings.update_available", "Update Available")}
                              className="inline-flex items-center gap-2 rounded-xl border border-brand-amber bg-brand-amber/10 px-4 py-2 text-sm font-bold text-brand-amber shadow-inner"
                            >
                              <AlertCircle size={16} />
                              {versionInfo?.apiVersion}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-2 text-sm font-bold text-green-400 shadow-inner">
                              <Check size={16} />
                              {t("settings.latest", "Latest")}
                            </span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-4 text-sm font-bold text-gray-200">{t("settings.ui_tag", "UI Tag")}</td>
                        <td className="p-4 text-sm text-gray-200">{versionInfo?.currentUiTag ?? "-"}</td>
                        <td className="whitespace-nowrap p-4">
                          {!versionInfo ? (
                            <span className="text-sm text-gray-500">-</span>
                          ) : versionInfo.uiHasUpdate ? (
                            <button
                              onClick={updateUI}
                              disabled={isUpdatingUI}
                              title={t("settings.update_available", "Update Available")}
                              className="flex items-center gap-2 text-brand-amber bg-brand-amber/10 hover:bg-brand-amber/20 border border-brand-amber hover:border-brand-amber transition-colors px-4 py-2 rounded-xl text-sm font-bold shadow-inner disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <RefreshCw
                                size={16}
                                className={isUpdatingUI ? "animate-spin text-brand-amber" : "text-brand-amber"}
                              />
                              {versionInfo?.currentUiTag}
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-2 text-sm font-bold text-green-400 shadow-inner">
                              <Check size={16} />
                              {t("settings.latest", "Latest")}
                            </span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "servers" && <ServerSettingsPage />}
          {activeTab === "users" && <UsersSettingsPage />}
          {activeTab === "librarySettings" && <LibrarySettingsPage />}
          {activeTab === "migrations" && <ActivityMigrationPage />}
          {activeTab === "backups" && <BackupsPage />}
          {activeTab === "tasks" && <TasksPage />}
        </div>
      </div>
    </>
  );
}
