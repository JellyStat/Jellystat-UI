import { useEffect, useState, useCallback } from "react";
import { Server, Plus, Loader2, AlertCircle, Globe, ShieldCheck, ShieldClose } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import client from "@/lib/api";
import { Server as ServerModel } from "@/lib/models/server";

export default function ServerSettingsPage() {
  const { t } = useTranslation("common");

  // --- STATE ---
  const [servers, setServers] = useState<ServerModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [isAddServerOpen, setIsAddServerOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<ServerModel | null>(null);

  // --- DATA FETCHING ---
  const fetchServers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await configManager.getConfig(true);
      setServers(data ?? []);
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
  const toggleRemoteAuth = async (server: ServerModel) => {
    setTogglingId(server.id);
    try {
      const enabled = Boolean(await client.Api.toggleAllowRemoteAuth(server.id));
      setServers((current) => current.map((s) => (s.id === server.id ? { ...s, allowRemoteAuth: enabled } : s)));
      toast.success(
        enabled
          ? t("settings.toast_remote_auth_on", "Remote authentication enabled for {{name}}", { name: server.name })
          : t("settings.toast_remote_auth_off", "Remote authentication disabled for {{name}}", { name: server.name }),
      );
    } catch (err) {
      console.error(err);
      toast.error(t("settings.error_auth_update", "Failed to update authentication settings"));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12 py-4 sm:p-6">
      {/* Header Container */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-brand-cyan/10 rounded-2xl border border-brand-cyan/20 shadow-inner shrink-0">
            <Server size={28} className="text-brand-cyan" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {t("settings.servers_auth_title", "Servers")}
            </h1>
            <p className="text-sm text-gray-400 mt-1 font-medium">
              {t("settings.servers_auth_subtitle", "Manage connected media servers and whether their users can sign in to Jellystat.")}
            </p>
          </div>
        </div>
      </div>

      <div>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Database size={20} className="text-brand-cyan" />
              {t("settings.connected_servers", "Connected Servers")}
            </h2>
            <button
              onClick={() => setIsAddServerOpen(true)}
              className="flex items-center gap-2 bg-surface hover:bg-surface-hover border border-border hover:border-brand-cyan transition-colors px-4 py-2 rounded-xl text-sm font-bold shadow-inner"
            >
              <Plus size={16} className="text-brand-cyan" />
              {t("settings.add_server", "Add Server")}
            </button>
          </div>

          <div className="bg-surface border border-border rounded-2xl shadow-xl shadow-black/20 overflow-hidden relative">
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
                {servers.map((server: ServerModel) => (
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
                        {server.allowRemoteAuth ? (
                          <ShieldCheck size={20} className="text-brand-emerald" />
                        ) : (
                          <ShieldClose size={20} className="text-brand-rose" />
                        )}
                      </h3>
                      <div className="flex items-center flex-wrap gap-4 mt-2 text-xs text-gray-400 font-mono">
                        <span
                          className="flex items-center gap-1.5 cursor-pointer hover:text-brand-purple transition-colors"
                          onClick={() => window.open(server.url, "_blank")}
                        >
                          <Globe size={12} /> {server.url}
                        </span>
                        {server.externalURL && (
                          <span
                            className="flex items-center gap-1.5 cursor-pointer hover:text-brand-purple transition-colors"
                            onClick={() => window.open(server.externalURL, "_blank")}
                          >
                            <Globe size={12} className="text-brand-purple" /> {server.externalURL}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleRemoteAuth(server)}
                        disabled={togglingId === server.id}
                        aria-pressed={!!server.allowRemoteAuth}
                        title={
                          server.allowRemoteAuth
                            ? t(
                                "settings.remote_auth_on_hint",
                                "Users can sign in with their Jellyfin or Emby credentials. Click to disable.",
                              )
                            : t(
                                "settings.remote_auth_off_hint",
                                "Only local Jellystat users can sign in for this server. Click to allow Jellyfin or Emby sign-in.",
                              )
                        }
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all shadow-inner disabled:opacity-50 disabled:cursor-not-allowed ${
                          server.allowRemoteAuth
                            ? "text-brand-emerald bg-brand-emerald/10 border-brand-emerald/40 hover:border-brand-emerald"
                            : "text-gray-400 bg-background border-border hover:border-gray-500 hover:text-white"
                        }`}
                      >
                        {togglingId === server.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : server.allowRemoteAuth ? (
                          <ShieldCheck size={13} />
                        ) : (
                          <ShieldClose size={13} />
                        )}
                        {t("settings.remote_auth_short", "Remote auth")}:{" "}
                        {server.allowRemoteAuth ? t("common.on", "On") : t("common.off", "Off")}
                      </button>
                      <button
                        onClick={() => setEditingServer(server)}
                        className="px-3 py-1.5 text-xs font-bold text-gray-300 hover:text-white bg-background border border-border hover:border-gray-500 rounded-lg transition-all shadow-inner"
                      >
                        {t("common.edit", "Edit")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
      <Dialog open={isAddServerOpen} onClose={setIsAddServerOpen} className="relative z-50 focus:outline-none">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center-safe justify-center p-3 sm:p-4 overflow-y-auto">
          <AddServerModal onClose={() => setIsAddServerOpen(false)} onCreated={fetchServers} />
        </div>
      </Dialog>

      <Dialog open={editingServer !== null} onClose={() => setEditingServer(null)} className="relative z-50 focus:outline-none">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center-safe justify-center p-3 sm:p-4 overflow-y-auto">
          {editingServer && (
            <EditServerModal server={editingServer} onClose={() => setEditingServer(null)} onSaved={fetchServers} />
          )}
        </div>
      </Dialog>
    </div>
  );
}

import { Database } from "lucide-react";
import configManager from "@/lib/configManager";
import { Dialog } from "@headlessui/react";
import AddServerModal from "./AddServer";
import EditServerModal from "./EditServer";
