import { Dialog } from "@headlessui/react";
import clsx from "clsx";
import { AlertCircle, CheckCircle2, Loader2, Pencil, Plus, Send, Webhook } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import ConfirmationDialogButton from "@/components/Core/ConfirmationDialogButton";
import client from "@/lib/api";
import configManager from "@/lib/configManager";
import { formatDateTime } from "@/lib/dateFormat";
import type { Server } from "@/lib/models/server";
import type { EventWebhook, WebhookEventInfo } from "@/lib/models/webhooks";
import WebhookEditor, { emptyWebhook } from "./WebhookEditor";

export default function WebhooksPage() {
  const { t } = useTranslation("common");

  const [webhooks, setWebhooks] = useState<EventWebhook[]>([]);
  const [events, setEvents] = useState<WebhookEventInfo[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<EventWebhook | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const fetchWebhooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      configManager
        .getConfig()
        .then((list: Server[]) => setServers(list))
        .catch(() => setServers([]));
      const [list, eventList] = await Promise.all([client.Webhooks.list(), client.Webhooks.events()]);
      setWebhooks(list ?? []);
      setEvents(eventList ?? []);
    } catch (err: any) {
      setError(err?.message ?? t("settings.error_load_webhooks", "Failed to load webhooks"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  async function handleTest(webhook: EventWebhook) {
    setBusy(webhook.id!);
    try {
      const result = await client.Webhooks.test({ Id: webhook.id!, Event: webhook.events[0] });
      if (result.success) {
        toast.success(t("settings.webhook_test_sent", "Test delivered in {{ms}} ms", { ms: result.elapsedMs }));
      } else {
        toast.error(result.error ?? t("settings.webhook_test_failed", "Test delivery failed"));
      }
      await fetchWebhooks();
    } catch (err: any) {
      toast.error(err?.message ?? t("settings.webhook_test_failed", "Test delivery failed"));
    } finally {
      setBusy(null);
    }
  }

  async function handleToggle(webhook: EventWebhook) {
    setBusy(webhook.id!);
    try {
      // secret: null keeps the saved one
      await client.Webhooks.save({ ...webhook, enabled: !webhook.enabled, secret: null });
      await fetchWebhooks();
    } catch (err: any) {
      toast.error(err?.message ?? t("settings.error_save_webhook", "Failed to save the webhook"));
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(id: string) {
    try {
      setLoading(true);
      await client.Webhooks.delete({ Id: id });
      await fetchWebhooks();
    } catch (err: any) {
      setError(err?.message ?? t("settings.error_delete_webhook", "Failed to delete the webhook"));
      setLoading(false);
    }
  }

  const eventLabel = (key: string) => events.find((e) => e.key === key)?.label ?? key;
  const serverName = (id?: string | null) =>
    id ? (servers.find((s) => s.id === id)?.name ?? id) : t("settings.webhook_all_servers", "All servers");

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12 py-4 sm:p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/50 pb-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-brand-cyan/10 rounded-2xl border border-brand-cyan/20 shadow-inner shrink-0">
            <Webhook size={28} className="text-brand-cyan" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{t("settings.webhooks_title", "Webhooks")}</h1>
            <p className="text-sm text-gray-400 mt-1 font-medium">
              {t(
                "settings.webhooks_subtitle",
                "Post playback and new media events to Discord or any URL as they happen. Scheduled reports are set up from each report.",
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="relative min-h-[400px] space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Webhook size={20} className="text-brand-cyan" />
            {t("settings.webhooks", "Webhooks")}
          </h2>
          <button
            type="button"
            onClick={() => setEditing(emptyWebhook())}
            disabled={events.length === 0}
            className="flex items-center gap-2 bg-surface hover:bg-surface-hover border border-border hover:border-brand-cyan transition-colors px-4 py-2 rounded-xl text-sm font-bold shadow-inner disabled:opacity-50"
          >
            <Plus size={16} className="text-brand-cyan" />
            {t("settings.add_webhook", "New webhook")}
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

          {!loading && !error && webhooks.length === 0 ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center">
              <Webhook size={48} className="mb-4 opacity-20" />
              <span className="font-bold text-lg">{t("settings.no_webhooks", "No webhooks yet")}</span>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {webhooks.map((w) => (
                <div
                  key={w.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-hover transition-colors"
                >
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-gray-100 break-all">{w.name}</h3>
                      <button
                        type="button"
                        disabled={busy !== null}
                        onClick={() => handleToggle(w)}
                        title={t("settings.webhook_toggle", "Turn on or off")}
                        className={clsx(
                          "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border cursor-pointer disabled:opacity-50",
                          w.enabled ? "bg-brand-emerald/10 text-brand-emerald border-brand-emerald/20" : "text-gray-500 border-border",
                        )}
                      >
                        {w.enabled ? t("settings.webhook_on", "On") : t("settings.webhook_off", "Off")}
                      </button>
                      <span className="text-[10px] uppercase tracking-wider bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 px-2 py-0.5 rounded-full">
                        {w.type}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider bg-brand-purple/10 text-brand-purple border border-brand-purple/20 px-2 py-0.5 rounded-full">
                        {serverName(w.serverId)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                      <span>{w.events.map(eventLabel).join(", ")}</span>
                      {w.lastTriggeredAt ? (
                        <span
                          className={clsx("flex items-center gap-1", w.lastSuccess ? "text-brand-emerald" : "text-brand-rose")}
                          title={w.lastError ?? undefined}
                        >
                          {w.lastSuccess ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                          {t("settings.webhook_last_sent", "Last sent")} {formatDateTime(w.lastTriggeredAt)}
                          {w.lastEvent ? ` (${w.lastEvent})` : ""}
                        </span>
                      ) : (
                        <span>{t("settings.webhook_never_sent", "Never sent")}</span>
                      )}
                    </div>
                    {w.lastSuccess === false && w.lastError && <p className="text-[11px] text-brand-rose break-words">{w.lastError}</p>}
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => handleTest(w)}
                      title={t("settings.webhook_test_hint", "Send a sample {{event}} event", {
                        event: eventLabel(w.events[0]),
                      })}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-300 hover:text-white border border-border hover:border-brand-cyan rounded-lg transition-all cursor-pointer disabled:opacity-50"
                    >
                      {busy === w.id ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                      {t("settings.webhook_test", "Test")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing({ ...w, secret: null })}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-300 hover:text-white border border-border hover:border-brand-cyan rounded-lg transition-all cursor-pointer"
                    >
                      <Pencil size={13} />
                      {t("common.edit", "Edit")}
                    </button>
                    <ConfirmationDialogButton
                      disabled={loading}
                      buttonElement={<div>{t("common.delete", "Delete")}</div>}
                      dialogTitle={t("settings.delete_webhook", "Delete webhook {{name}}", {
                        name: w.name,
                      })}
                      description={t("settings.confirm_delete_webhook", "Events will stop being sent to this URL. This cannot be undone.")}
                      onConfirm={() => handleDelete(w.id!)}
                      actionColor="bg-brand-rose"
                      className="px-3 py-1.5 text-xs font-bold text-brand-rose hover:text-white border-brand-rose/60 bg-brand-rose/10 border hover:bg-rose-600 rounded-lg transition-all shadow-inner"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={editing !== null} onClose={() => {}} className="relative z-50 focus:outline-none">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-6">
          {editing && (
            <WebhookEditor webhook={editing} events={events} servers={servers} onClose={() => setEditing(null)} onSaved={fetchWebhooks} />
          )}
        </div>
      </Dialog>
    </div>
  );
}
