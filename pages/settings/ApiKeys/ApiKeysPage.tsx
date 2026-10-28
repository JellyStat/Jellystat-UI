import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog } from "@headlessui/react";
import { AlertCircle, Eye, KeyRound, Loader2, Plus, ShieldCheck } from "lucide-react";

import client from "@/lib/api";
import configManager from "@/lib/configManager";
import Permissions from "@/lib/models/enums/Permissions";
import type { ApiKeyInfo } from "@/lib/models/apiKey";
import type { Server } from "@/lib/models/server";
import ConfirmationDialogButton from "@/components/Core/ConfirmationDialogButton";
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
  const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleString() : null);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12 p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/50 pb-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-brand-cyan/10 rounded-2xl border border-brand-cyan/20 shadow-inner shrink-0">
            <KeyRound size={28} className="text-brand-cyan" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">{t("settings.api_keys_title", "API Keys")}</h1>
            <p className="text-sm text-gray-400 mt-1 font-medium">
              {t("settings.api_keys_subtitle", "Let other apps read from Jellystat using the x-api-token header.")}
            </p>
          </div>
        </div>
      </div>

      <div className="relative min-h-[400px] space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <KeyRound size={20} className="text-brand-cyan" />
            {t("settings.api_keys", "Keys")}
          </h2>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 bg-surface hover:bg-surface-hover border border-border hover:border-brand-cyan transition-colors px-4 py-2 rounded-xl text-sm font-bold shadow-inner"
          >
            <Plus size={16} className="text-brand-cyan" />
            {t("settings.add_api_key", "Create API Key")}
          </button>
        </div>

        <div className="bg-surface border border-border rounded-2xl shadow-xl shadow-black/20 overflow-hidden relative">
          {loading && (
            <div className="absolute inset-0 z-20 bg-surface/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in">
              <Loader2 size={32} className="text-brand-cyan animate-spin mb-3" />
            </div>
          )}

          {error && !loading && (
            <div className="p-4 flex items-center gap-3 border-b border-border/50">
              <AlertCircle size={18} className="text-brand-rose shrink-0" />
              <span className="text-sm text-gray-400">{error}</span>
            </div>
          )}

          {!loading && !error && keys.length === 0 ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center">
              <KeyRound size={48} className="mb-4 opacity-20" />
              <span className="font-bold text-lg">{t("settings.no_api_keys", "No API keys yet")}</span>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {keys.map((key) => {
                const isAdmin = key.permission === Permissions.Administrator;
                const server = serverName(key.serverId);
                return (
                  <div
                    key={key.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-hover transition-colors"
                  >
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-gray-100 break-all">{key.name}</h3>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            isAdmin
                              ? "bg-brand-rose/10 text-brand-rose border-brand-rose/20"
                              : "bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20"
                          }`}
                        >
                          {isAdmin ? <ShieldCheck size={11} /> : <Eye size={11} />}
                          {isAdmin ? t("settings.api_key_admin", "Full admin") : t("settings.api_key_read_only", "Read only")}
                        </span>
                        {!isAdmin && server && (
                          <span className="text-[10px] uppercase tracking-wider bg-brand-purple/10 text-brand-purple border border-brand-purple/20 px-2 py-0.5 rounded-full">
                            {server}
                          </span>
                        )}
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
                      buttonElement={<div>{t("common.delete", "Delete")}</div>}
                      dialogTitle={t("settings.delete_api_key", "Delete API key {{name}}", { name: key.name })}
                      description={t(
                        "settings.confirm_delete_api_key",
                        "Apps using this key will immediately lose access. This cannot be undone.",
                      )}
                      onConfirm={() => handleDelete(key.id)}
                      actionColor="bg-brand-rose"
                      className="px-3 py-1.5 text-xs font-bold text-brand-rose hover:text-white border-brand-rose/60 bg-brand-rose/10 border hover:bg-rose-600 rounded-lg transition-all shadow-inner"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isCreateOpen} onClose={() => {}} className="relative z-50 focus:outline-none">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <CreateApiKeyModal servers={servers} onClose={() => setIsCreateOpen(false)} onCreated={fetchKeys} />
        </div>
      </Dialog>
    </div>
  );
}
