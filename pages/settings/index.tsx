import { useState } from "react";
import Head from "next/head";
import { Settings, Library, ArrowLeftRight, Terminal, Server, Users, Archive } from "lucide-react";
import { useTranslation } from "react-i18next";

import ActivityMigrationPage from "./ActivityMigration/ActivityMigration";
import TasksPage from "./Tasks/Tasks";
import LibrarySettingsPage from "./Library/LibrarySettings";
import ServerSettingsPage from "./Servers/ServerSettings";
import UsersSettingsPage from "./Users";
import BackupsPage from "./Backups/BackupsPage";
import LanguageSwitcher from "@/components/Core/LanguageSwitcher";

export default function SettingsPage() {
  const { t } = useTranslation("common");

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
            <div className="max-w-[1600px] mx-auto p-6 animate-in fade-in duration-500">
              <div className="bg-surface/30 border border-border rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Settings size={24} className="text-brand-cyan" />
                  <h3 className="text-xl font-black text-gray-200 tracking-tight">
                    {t("settings.general_title", "General Settings")}
                  </h3>
                </div>
                <div className="space-y-6">
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
