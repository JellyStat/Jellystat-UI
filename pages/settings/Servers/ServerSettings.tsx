import { useEffect, useState, useCallback } from "react";
import { Server, ShieldAlert, Users, Plus, Loader2, AlertCircle, Globe, Key, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "next-i18next/pages";

import client from "@/lib/api";
import { Server as ServerModel } from "@/lib/models/server";

export default function ServerSettingsPage() {
  const { t } = useTranslation("common");

  // --- STATE ---
  const [servers, setServers] = useState<ServerModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [remoteAuthEnabled, setRemoteAuthEnabled] = useState(false);

  // --- DATA FETCHING ---
  const fetchServers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await configManager.getConfig(true);
      const currentConfig = await configManager.getActiveConfig();
      setServers(data ?? []);
      setRemoteAuthEnabled(currentConfig?.allowRemoteAuth ?? false);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? t("settings.error_load_servers", "Failed to load server configuration."));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  // --- HANDLERS ---
  const toggleRemoteAuth = async (enabled: boolean) => {
    setRemoteAuthEnabled(enabled);
    try {
      //@TODO
      const config = await configManager.getActiveConfig();
      await client.Api.toggleAllowRemoteAuth(config?.id);
      fetchServers(); // Refresh server list to reflect changes
      toast.success(t("settings.toast_auth_updated", "Authentication preferences updated"));
    } catch (err) {
      setRemoteAuthEnabled(!enabled); // Revert
      toast.error(t("settings.error_auth_update", "Failed to update authentication settings"));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12 p-6">
      {/* Header Container */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-brand-cyan/10 rounded-2xl border border-brand-cyan/20 shadow-inner shrink-0">
            <Server size={28} className="text-brand-cyan" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              {t("settings.servers_auth_title", "Servers & Authentication")}
            </h1>
            <p className="text-sm text-gray-400 mt-1 font-medium">
              {t("settings.servers_auth_subtitle", "Manage connected media servers and control user access policies.")}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Servers */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Database size={20} className="text-brand-cyan" />
              {t("settings.connected_servers", "Connected Servers")}
            </h2>
            <button className="flex items-center gap-2 bg-surface hover:bg-surface-hover border border-border hover:border-brand-cyan transition-colors px-4 py-2 rounded-xl text-sm font-bold shadow-inner">
              <Plus size={16} className="text-brand-cyan" />
              {t("settings.add_server", "Add Server")}
            </button>
          </div>

          <div className="bg-surface border border-border rounded-2xl shadow-xl shadow-black/20 overflow-hidden relative min-h-[200px]">
            {loading && (
              <div className="absolute inset-0 z-20 bg-surface/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in">
                <Loader2 size={32} className="text-brand-cyan animate-spin mb-3" />
              </div>
            )}

            {error && !loading && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle size={32} className="text-brand-rose mb-2" />
                <span className="text-sm text-gray-400">{error}</span>
              </div>
            )}

            {!loading && !error && servers.length === 0 ? (
              <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center">
                <Server size={48} className="mb-4 opacity-20" />
                <span className="font-bold text-lg">{t("settings.no_servers", "No servers connected")}</span>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {servers.map((server) => (
                  <div
                    key={server.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-hover transition-colors"
                  >
                    <div>
                      <h3 className="font-bold text-gray-100 flex items-center gap-2">
                        {server.name}
                        <span className="text-[10px] uppercase tracking-wider bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 px-2 py-0.5 rounded-full">
                          {server.type || "Jellyfin"}
                        </span>
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 font-mono">
                        <span className="flex items-center gap-1.5">
                          <Globe size={12} /> {server.url}
                        </span>
                        {server.externalURL && (
                          <span className="flex items-center gap-1.5">
                            <Globe size={12} className="text-brand-purple" /> {server.externalURL}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1.5 text-xs font-bold text-gray-300 hover:text-white bg-background border border-border hover:border-gray-500 rounded-lg transition-all shadow-inner">
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Authentication & Users */}
        <div className="space-y-8">
          {/* Global Auth Settings */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck size={20} className="text-brand-emerald" />
              {t("settings.access_policies", "Access Policies")}
            </h2>

            <div className="bg-surface border border-border rounded-2xl p-5 shadow-xl shadow-black/20">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-gray-100 mb-1">{t("settings.remote_auth", "Remote Authentication")}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {t(
                      "settings.remote_auth_desc",
                      "Allow users to log into Jellystat using their existing Jellyfin or Emby credentials.",
                    )}
                  </p>
                </div>
                {/* Toggle */}
                <button
                  onClick={() => toggleRemoteAuth(!remoteAuthEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-emerald focus:ring-offset-2 focus:ring-offset-background ${
                    remoteAuthEnabled ? "bg-brand-emerald" : "bg-background border border-border shadow-inner"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      remoteAuthEnabled ? "translate-x-6 shadow-md" : "translate-x-1 opacity-70"
                    }`}
                  />
                </button>
              </div>

              {!remoteAuthEnabled && (
                <div className="mt-4 p-3 bg-brand-rose/10 border border-brand-rose/20 rounded-xl flex gap-3 animate-in fade-in zoom-in-95">
                  <ShieldAlert size={16} className="text-brand-rose shrink-0 mt-0.5" />
                  <p className="text-xs text-brand-rose font-medium">
                    {t(
                      "settings.remote_auth_warning",
                      "Warning: If disabled, only Local Administrators will be able to log into this dashboard.",
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Local Users Placeholder */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users size={20} className="text-brand-purple" />
                {t("settings.local_users", "Local Users")}
              </h2>
              <button className="flex items-center justify-center w-8 h-8 bg-surface hover:bg-surface-hover border border-border hover:border-brand-purple transition-colors rounded-xl shadow-inner group">
                <Plus size={16} className="text-gray-400 group-hover:text-brand-purple" />
              </button>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-5 shadow-xl shadow-black/20 text-center">
              <Key size={32} className="mx-auto mb-3 text-gray-500 opacity-30" />
              <p className="text-sm font-bold text-gray-300 mb-1">{t("settings.local_administrators", "Local Administrators")}</p>
              <p className="text-xs text-gray-500 mb-4">
                {t(
                  "settings.local_administrators_desc",
                  "Manage accounts created directly within Jellystat bypassing media server authentication.",
                )}
              </p>

              <button className="w-full py-2 bg-background border border-border hover:border-brand-purple text-gray-300 hover:text-white rounded-xl text-xs font-bold transition-all shadow-inner">
                {t("settings.manage_local_users", "Manage Local Accounts")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Database } from "lucide-react";
import configManager from "@/lib/configManager";
