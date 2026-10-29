import { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import {
  Settings,
  Library,
  ArrowLeftRight,
  Terminal,
  Server,
  KeyRound,
  Archive,
  Info,
  RefreshCw,
  Check,
  AlertCircle,
  Clock,
  Webhook,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import ActivityMigrationPage from "@/components/Settings/ActivityMigration/ActivityMigration";
import TasksPage from "@/components/Settings/Tasks/Tasks";
import LibrarySettingsPage from "@/components/Settings/Library/LibrarySettings";
import ServerSettingsPage from "@/components/Settings/Servers/ServerSettings";
import UsersSettingsPage from "@/components/Settings/Users/UsersSettings";
import BackupsPage from "@/components/Settings/Backups/BackupsPage";
import ApiKeysPage from "@/components/Settings/ApiKeys/ApiKeysPage";
import WebhooksPage from "@/components/Settings/Webhooks/WebhooksPage";
import LanguageSwitcher from "@/components/Core/LanguageSwitcher";
import DropdownSelector from "@/components/Core/DropdownSelector";
import { getHourFormat, setHourFormat, type HourFormat } from "@/lib/dateFormat";
import { VersionInfo } from "@/lib/models/VersionInfo";
import versionManager from "@/lib/versionManager";
import client from "@/lib/api";
import permissionsManager from "@/lib/permissionsManager";
import Permissions from "@/lib/models/enums/Permissions";

const hourFormatOptions: HourFormat[] = ["auto", "12", "24"];

export default function SettingsPage() {
  const { t } = useTranslation("common");
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [isUpdatingUI, setIsUpdatingUI] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(
    localStorage.getItem("PREF_SETTINGS_TAB") === "users" ? "servers" : (localStorage.getItem("PREF_SETTINGS_TAB") ?? "settings"),
  );
  const [isAdmin, setIsAdmin] = useState(false);
  const [hourFormat, setHourFormatState] = useState<HourFormat>(getHourFormat());

  useEffect(() => {
    const adminCheck = permissionsManager.hasPermission(Permissions.Administrator);
    setIsAdmin(adminCheck);
    if (!adminCheck && activeTab !== "settings") {
      setAndStoreActiveTab("settings");
    }
  }, []);

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

  // Keep the active tab visible inside the horizontally scrollable tab bar (mobile)
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    document
      .getElementById(`settings-tab-${activeTab}`)
      ?.scrollIntoView?.({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeTab, isAdmin]);

  const setAndStoreActiveTab = (tab: string) => {
    setActiveTab(tab);
    localStorage.setItem("PREF_SETTINGS_TAB", tab);
    // You can add additional logic here to store the active tab in local storage or elsewhere if needed
  };

  const tabs = [
    { id: "settings", label: t("settings.tab_general", "General"), icon: Settings, IsAdmin: false },
    { id: "servers", label: t("settings.tab_servers_users", "Servers & Users"), icon: Server, IsAdmin: true },
    { id: "apikeys", label: t("settings.tab_api_keys", "API Keys"), icon: KeyRound, IsAdmin: true },
    { id: "webhooks", label: t("settings.tab_webhooks", "Webhooks"), icon: Webhook, IsAdmin: true },
    { id: "librarySettings", label: t("settings.tab_library", "Library"), icon: Library, IsAdmin: true },
    { id: "migrations", label: t("settings.tab_migrations", "Activity Migration"), icon: ArrowLeftRight, IsAdmin: true },
    { id: "backups", label: t("settings.tab_backups", "Backups"), icon: Archive, IsAdmin: true },
    { id: "tasks", label: t("settings.tab_tasks", "Background Tasks"), icon: Terminal, IsAdmin: true },
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
        <div className="max-w-[1600px] mx-auto sm:px-6 sm:pt-6 animate-in slide-in-from-top-4 duration-500">
          <div className="flex overflow-x-auto custom-scrollbar pb-2 sm:pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
            {/* Glassmorphic Tab Container */}
            <div className="flex items-center p-1.5 bg-surface/60 backdrop-blur-xl border border-border rounded-2xl shadow-inner w-full justify-between">
              {tabs
                .filter((tab) => !tab.IsAdmin || isAdmin)
                .map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      id={`settings-tab-${tab.id}`}
                      onClick={() => setAndStoreActiveTab(tab.id)}
                      className={`flex items-center gap-2 sm:gap-2.5 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap lg:whitespace-normal transition-all duration-300 group ${
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
            <div className="max-w-[1600px] mx-auto py-4 sm:p-6 animate-in fade-in duration-500 flex flex-col gap-3">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <Settings size={24} className="text-brand-cyan" />
                  <h3 className="text-xl font-black text-gray-200 tracking-tight">
                    {t("settings.general_title", "General Settings")}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-surface-hover/50 rounded-2xl border border-border">
                  <div>
                    <h4 className="text-sm font-bold text-gray-200">{t("settings.language", "Language")}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {t("settings.language_desc", "Select your preferred display language")}
                    </p>
                  </div>
                  <LanguageSwitcher />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 mt-3 bg-surface-hover/50 rounded-2xl border border-border">
                  <div>
                    <h4 className="text-sm font-bold text-gray-200">{t("settings.hour_format", "Time Format")}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {t("settings.hour_format_desc", "Show times on a 12-hour or 24-hour clock")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-gray-400" />
                    <DropdownSelector<HourFormat>
                      data={hourFormatOptions.map((value) => ({ value }))}
                      value={hourFormat}
                      onChange={(value) => {
                        setHourFormat(value);
                        setHourFormatState(value);
                      }}
                      labelFn={(value) =>
                        value === "12"
                          ? t("settings.hour_format_12", "12-hour")
                          : value === "24"
                            ? t("settings.hour_format_24", "24-hour")
                            : t("settings.hour_format_auto", "Match language")
                      }
                    />
                  </div>
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
                      <col className="w-24 sm:w-30" />
                      <col className="w-36 sm:w-40" />
                    </colgroup>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="p-3 sm:p-4 text-sm font-bold text-gray-200">{t("settings.api", "API")}</td>
                        <td className="p-3 sm:p-4 text-sm text-gray-200">{versionInfo?.apiVersion ?? "-"}</td>
                        <td className="whitespace-nowrap p-3 sm:p-4">
                          {!versionInfo ? (
                            <span className="text-sm text-gray-500">-</span>
                          ) : versionInfo.apiHasUpdate ? (
                            <span
                              title={t("settings.api_update_available", "Update available: pull the latest Docker image to update")}
                              className="inline-flex items-center gap-2 rounded-xl border border-brand-amber bg-brand-amber/10 px-4 py-2 text-sm font-bold text-brand-amber shadow-inner"
                            >
                              <AlertCircle size={16} />
                              {versionInfo?.latestApiVersion}
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
                        <td className="p-3 sm:p-4 text-sm font-bold text-gray-200">{t("settings.ui_tag", "UI Tag")}</td>
                        <td className="p-3 sm:p-4 text-sm text-gray-200">{versionInfo?.currentUiTag ?? "-"}</td>
                        <td className="whitespace-nowrap p-3 sm:p-4">
                          {!versionInfo ? (
                            <span className="text-sm text-gray-500">-</span>
                          ) : versionInfo.uiHasUpdate ? (
                            <button
                              onClick={updateUI}
                              disabled={isUpdatingUI || !isAdmin}
                              title={t("settings.update_available", "Update Available")}
                              className="flex items-center gap-2 text-brand-amber bg-brand-amber/10 hover:bg-brand-amber/20 border border-brand-amber hover:border-brand-amber transition-colors px-4 py-2 rounded-xl text-sm font-bold shadow-inner disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <RefreshCw
                                size={16}
                                className={isUpdatingUI ? "animate-spin text-brand-amber" : "text-brand-amber"}
                              />
                              {versionInfo?.latestUiTag}
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

          {activeTab === "servers" && (
            <>
              <ServerSettingsPage />
              <div className="max-w-[1600px] mx-auto sm:px-6">
                <hr className="border-border/50" />
              </div>
              <UsersSettingsPage />
            </>
          )}
          {activeTab === "apikeys" && <ApiKeysPage />}
          {activeTab === "webhooks" && <WebhooksPage />}
          {activeTab === "librarySettings" && <LibrarySettingsPage />}
          {activeTab === "migrations" && <ActivityMigrationPage />}
          {activeTab === "backups" && <BackupsPage />}
          {activeTab === "tasks" && <TasksPage />}
        </div>
      </div>
    </>
  );
}
