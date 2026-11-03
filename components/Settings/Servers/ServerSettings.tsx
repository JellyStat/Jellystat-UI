import { useEffect, useState, useCallback } from "react";
import { Server, Plus, AlertCircle, Globe, ShieldCheck, ShieldClose, Database } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import client from "@/lib/api";
import configManager from "@/lib/configManager";
import { Server as ServerModel } from "@/lib/models/server";
import { Badge, Button, Card, cn, EmptyState, Modal, Page, PageHeader, SectionTitle, Spinner, Switch } from "@/components/ui";
import AddServerModal from "./AddServer";
import EditServerModal from "./EditServer";

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
      setError(err?.message ?? t("errors.failed_to_load_server_configuration", "Failed to load server configuration."));
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
      toast.error(t("errors.failed_to_update_authentication_settings", "Failed to update authentication settings"));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <Page className="pt-4 sm:px-6 sm:pt-6">
      <PageHeader
        iconTone="accent"
        icon={<Server size={28} />}
        title={t("settings.servers_auth_title", "Servers")}
        description={t(
          "settings.servers_auth_subtitle",
          "Manage connected media servers and control user access policies.",
        )}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <SectionTitle className="flex items-center gap-2">
            <Database size={20} className="text-accent" />
            {t("settings.connected_servers", "Connected Servers")}
          </SectionTitle>
          <Button variant="outline" onClick={() => setIsAddServerOpen(true)}>
            <Plus size={16} className="text-accent" />
            {t("common.add_server", "Add Server")}
          </Button>
        </div>

        <Card padding="none" className="relative min-h-[200px]">
          {loading && (
            <div className="absolute inset-0 z-20 bg-surface/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in">
              <Spinner size={32} tone="primary" />
            </div>
          )}

          {error && !loading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 p-6 text-center">
              <AlertCircle size={32} className="text-danger" />
              <span className="text-sm text-gray-400">{error}</span>
            </div>
          )}

          {!loading && !error && servers.length === 0 ? (
            <EmptyState bordered={false} Icon={Server} title={t("empty.no_servers_connected", "No servers connected")} />
          ) : (
            <div className="divide-y divide-border/50">
              {servers.map((server: ServerModel) => (
                <div
                  key={server.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-hover transition-colors"
                >
                  <div className="min-w-0">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      {server.name}
                      <Badge tone="accent">{server.type || "Jellyfin"}</Badge>
                      {server.allowRemoteAuth ? (
                        <ShieldCheck size={18} className="text-success" aria-label={t("settings.remote_auth_on_short", "Remote auth on")} />
                      ) : (
                        <ShieldClose size={18} className="text-gray-500" aria-label={t("settings.remote_auth_off_short", "Remote auth off")} />
                      )}
                    </h3>
                    <div className="flex items-center flex-wrap gap-4 mt-2 text-xs text-gray-400 font-mono">
                      <a
                        href={server.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 hover:text-accent transition-colors"
                      >
                        <Globe size={12} /> {server.url}
                      </a>
                      {server.externalURL && (
                        <a
                          href={server.externalURL}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 hover:text-accent transition-colors"
                        >
                          <Globe size={12} className="text-accent" /> {server.externalURL}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background border border-border"
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
                    >
                      {togglingId === server.id && <Spinner size={14} className="text-primary" />}
                      <Switch
                        checked={!!server.allowRemoteAuth}
                        onChange={() => toggleRemoteAuth(server)}
                        disabled={togglingId === server.id}
                        label={<span className="text-xs font-bold">{t("settings.remote_auth_short", "Remote auth")}</span>}
                      />
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setEditingServer(server)}>
                      {t("common.edit", "Edit")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Modal open={isAddServerOpen} onClose={setIsAddServerOpen}>
        <AddServerModal onClose={() => setIsAddServerOpen(false)} onCreated={fetchServers} />
      </Modal>

      <Modal open={editingServer !== null} onClose={() => setEditingServer(null)}>
        {editingServer && (
          <EditServerModal server={editingServer} onClose={() => setEditingServer(null)} onSaved={fetchServers} />
        )}
      </Modal>
    </Page>
  );
}
