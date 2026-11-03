import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Eye, KeyRound, Plus, ShieldCheck } from "lucide-react";

import client from "@/lib/api";
import { formatDateTime } from "@/lib/dateFormat";
import configManager from "@/lib/configManager";
import Permissions from "@/lib/models/enums/Permissions";
import type { ApiKeyInfo } from "@/lib/models/apiKey";
import type { Server } from "@/lib/models/server";
import ConfirmationDialogButton from "@/components/ConfirmationDialogButton";
import {
  Badge,
  Button,
  buttonClass,
  Card,
  EmptyState,
  Modal,
  Page,
  PageHeader,
  SectionTitle,
  Spinner,
} from "@/components/ui";
import CreateApiKeyModal from "./CreateApiKey";

export default function ApiKeysPage() {
  const { t } = useTranslation("common");

  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      configManager
        .getConfig()
        .then((list: Server[]) => setServers(list))
        .catch((err) => console.error("Failed to load server options", err));
      setKeys((await client.ApiKeys.list()) ?? []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? t("settings.error_load_api_keys", "Failed to load API keys"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  async function handleDelete(id: string) {
    try {
      setLoading(true);
      await client.ApiKeys.delete({ Id: id });
      await fetchKeys();
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? t("settings.error_delete_api_key", "Failed to delete API key"));
      setLoading(false);
    }
  }

  const serverName = (id?: string | null) => servers.find((s) => s.id === id)?.name ?? null;
  const formatDate = (value?: string | null) => formatDateTime(value) || null;

  return (
    <Page className="pt-4 sm:px-6 sm:pt-6">
      <PageHeader
        iconTone="accent"
        icon={<KeyRound size={28} />}
        title={t("settings.api_keys_title", "API Keys")}
        description={t("settings.api_keys_subtitle", "Let other apps read from Jellystat using the x-api-token header.")}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <SectionTitle className="flex items-center gap-2">
            <KeyRound size={20} className="text-accent" />
            {t("settings.api_keys", "Keys")}
          </SectionTitle>
          <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
            <Plus size={16} className="text-accent" />
            {t("settings.add_api_key", "Create API Key")}
          </Button>
        </div>

        <Card padding="none" className="relative min-h-[200px]">
          {loading && (
            <div className="absolute inset-0 z-20 bg-surface/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in">
              <Spinner size={32} tone="primary" />
            </div>
          )}

          {error && !loading && (
            <div className="p-4 flex items-center gap-3 border-b border-border/50">
              <AlertCircle size={18} className="text-danger shrink-0" />
              <span className="text-sm text-gray-400">{error}</span>
            </div>
          )}

          {!loading && !error && keys.length === 0 ? (
            <EmptyState bordered={false} Icon={KeyRound} title={t("settings.no_api_keys", "No API keys yet")} />
          ) : (
            <div className="divide-y divide-border/50">
              {keys.map((key) => {
                const isAdmin = key.permission === Permissions.Administrator;
                const server = serverName(key.serverId);
                return (
                  <div
                    key={key.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-hover transition-colors"
                  >
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-white break-all">{key.name}</h3>
                        <Badge tone={isAdmin ? "danger" : "accent"} className="gap-1">
                          {isAdmin ? <ShieldCheck size={11} /> : <Eye size={11} />}
                          {isAdmin ? t("settings.api_key_admin", "Full admin") : t("settings.api_key_read_only", "Read only")}
                        </Badge>
                        {!isAdmin && server && <Badge tone="primary">{server}</Badge>}
                      </div>
                      <div className="text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                        <code className="text-gray-400">{key.keyPrefix}…</code>
                        <span>
                          {t("settings.api_key_created_at", "Created")} {formatDate(key.createdAt)}
                        </span>
                        <span>
                          {t("settings.api_key_last_used", "Last used")}{" "}
                          {formatDate(key.lastUsedAt) ?? t("settings.api_key_never_used", "never")}
                        </span>
                      </div>
                    </div>

                    <ConfirmationDialogButton
                      disabled={loading}
                      buttonElement={t("common.delete", "Delete")}
                      dialogTitle={t("settings.delete_api_key", "Delete API key {{name}}", { name: key.name })}
                      description={t(
                        "settings.confirm_delete_api_key",
                        "Apps using this key will immediately lose access. This cannot be undone.",
                      )}
                      onConfirm={() => handleDelete(key.id)}
                      tone="danger"
                      className={buttonClass({ variant: "dangerSoft", size: "sm" })}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Not dismissible by backdrop click: the new key is only shown once. */}
      <Modal open={isCreateOpen} onClose={() => {}}>
        <CreateApiKeyModal servers={servers} onClose={() => setIsCreateOpen(false)} onCreated={fetchKeys} />
      </Modal>
    </Page>
  );
}
