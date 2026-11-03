import { useEffect, useState, useCallback } from "react";
import { Server, Plus, AlertCircle, Globe, ShieldCheck, ShieldClose, Database } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import client from "@/lib/api";
import configManager from "@/lib/configManager";
import { Server as ServerModel } from "@/lib/models/server";
import { Badge, Button, Card, cn, EmptyState, Modal, Page, PageHeader, SectionTitle, Spinner } from "@/components/ui";
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
    <Page className="pt-4 sm:px-6 sm:pt-6">
      <PageHeader
        iconTone="accent"
        icon={<Server size={28} />}
        title={t("settings.servers_auth_title", "Servers")}
        description={t(
          "settings.servers_auth_subtitle",
          "Manage connected media servers and whether their users can sign in to Jellystat.",
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
            {t("settings.add_server", "Add Server")}
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
            <EmptyState bordered={false} Icon={Server} title={t("settings.no_servers", "No servers connected")} />
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
                        <ShieldCheck size={18} className="text-success" />
                      ) : (
                        <ShieldClose size={18} className="text-danger" />
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
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => toggleRemoteAuth(server)}
                      loading={togglingId === server.id}
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
                      className={cn(
                        server.allowRemoteAuth &&
                          "text-success bg-success/10 border-success/40 hover:text-success hover:border-success",
                      )}
                    >
                      {togglingId !== server.id &&
                        (server.allowRemoteAuth ? <ShieldCheck size={14} /> : <ShieldClose size={14} />)}
                      {t("settings.remote_auth_short", "Remote auth")}:{" "}
                      {server.allowRemoteAuth ? t("common.on", "On") : t("common.off", "Off")}
                    </Button>
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
