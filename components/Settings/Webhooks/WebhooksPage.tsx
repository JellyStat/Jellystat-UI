import { AlertCircle, CheckCircle2, Pencil, Plus, Send, Webhook } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import ConfirmationDialogButton from "@/components/ConfirmationDialogButton";
import {
  Badge,
  Button,
  buttonClass,
  Card,
  cn,
  EmptyState,
  Modal,
  Page,
  PageHeader,
  SectionTitle,
  Spinner,
  Switch,
} from "@/components/ui";
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
      setError(err?.message ?? t("errors.failed_to_load_webhooks", "Failed to load webhooks"));
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
        toast.error(result.error ?? t("errors.test_delivery_failed", "Test delivery failed"));
      }
      await fetchWebhooks();
    } catch (err: any) {
      toast.error(err?.message ?? t("errors.test_delivery_failed", "Test delivery failed"));
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
      toast.error(err?.message ?? t("errors.failed_to_save_the_webhook", "Failed to save the webhook"));
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
      setError(err?.message ?? t("errors.failed_to_delete_the_webhook", "Failed to delete the webhook"));
      setLoading(false);
    }
  }

  const eventLabel = (key: string) => events.find((e) => e.key === key)?.label ?? key;
  const serverName = (id?: string | null) =>
    id ? (servers.find((s) => s.id === id)?.name ?? id) : t("settings.webhook_all_servers", "All servers");

  return (
    <Page className="pt-4 sm:px-6 sm:pt-6">
      <PageHeader
        iconTone="accent"
        icon={<Webhook size={28} />}
        title={t("common.webhooks", "Webhooks")}
        description={t(
          "settings.webhooks_subtitle",
          "Post playback and new media events to Discord or any URL as they happen. Scheduled reports are set up from each report.",
        )}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <SectionTitle className="flex items-center gap-2">
            <Webhook size={20} className="text-accent" />
            {t("common.webhooks", "Webhooks")}
          </SectionTitle>
          <Button variant="outline" onClick={() => setEditing(emptyWebhook())} disabled={events.length === 0}>
            <Plus size={16} className="text-accent" />
            {t("settings.add_webhook", "New webhook")}
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

          {!loading && !error && webhooks.length === 0 ? (
            <EmptyState bordered={false} Icon={Webhook} title={t("empty.no_webhooks_yet", "No webhooks yet")} />
          ) : (
            <div className="divide-y divide-border/50">
              {webhooks.map((w) => (
                <div
                  key={w.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-hover transition-colors"
                >
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-white break-all">{w.name}</h3>
                      <Switch
                        checked={w.enabled}
                        onChange={() => handleToggle(w)}
                        disabled={busy !== null}
                        label={
                          <span className="text-xs font-bold text-gray-400">
                            {w.enabled ? t("common.on", "On") : t("common.off", "Off")}
                          </span>
                        }
                      />
                      <Badge tone="accent">{w.type}</Badge>
                      <Badge tone="primary">{serverName(w.serverId)}</Badge>
                    </div>
                    <div className="text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                      <span>{w.events.map(eventLabel).join(", ")}</span>
                      {w.lastTriggeredAt ? (
                        <span
                          className={cn("flex items-center gap-1", w.lastSuccess ? "text-success" : "text-danger")}
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
                    {w.lastSuccess === false && w.lastError && (
                      <p className="text-xs text-danger break-words">{w.lastError}</p>
                    )}
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={busy !== null}
                      loading={busy === w.id}
                      onClick={() => handleTest(w)}
                      title={t("settings.webhook_test_hint", "Send a sample {{event}} event", {
                        event: eventLabel(w.events[0]),
                      })}
                    >
                      {busy !== w.id && <Send size={14} />}
                      {t("settings.webhook_test", "Test")}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setEditing({ ...w, secret: null })}>
                      <Pencil size={14} />
                      {t("common.edit", "Edit")}
                    </Button>
                    <ConfirmationDialogButton
                      disabled={loading}
                      buttonElement={t("common.delete", "Delete")}
                      dialogTitle={t("settings.delete_webhook", "Delete webhook {{name}}", {
                        name: w.name,
                      })}
                      description={t(
                        "settings.confirm_delete_webhook",
                        "Events will stop being sent to this URL. This cannot be undone.",
                      )}
                      onConfirm={() => handleDelete(w.id!)}
                      tone="danger"
                      className={buttonClass({ variant: "dangerSoft", size: "sm" })}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Not dismissible by backdrop click, so unsaved edits aren't lost. */}
      <Modal open={editing !== null} onClose={() => {}}>
        {editing && (
          <WebhookEditor
            webhook={editing}
            events={events}
            servers={servers}
            onClose={() => setEditing(null)}
            onSaved={fetchWebhooks}
          />
        )}
      </Modal>
    </Page>
  );
}
