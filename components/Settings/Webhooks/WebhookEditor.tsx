import { Plus, Trash2, Webhook } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import client from "@/lib/api";
import type { Server } from "@/lib/models/server";
import type { EventWebhook, EventWebhookType, WebhookEventInfo, WebhookEventKey } from "@/lib/models/webhooks";
import {
  Button,
  Checkbox,
  Field,
  IconButton,
  Input,
  ModalFooter,
  ModalHeader,
  ModalPanel,
  Select,
  Switch,
  Textarea,
} from "@/components/ui";

type Props = {
  webhook: EventWebhook;
  events: WebhookEventInfo[];
  servers: Server[];
  onClose: () => void;
  onSaved: () => void;
};

const ALL_SERVERS = "__all__";

const DEFAULT_TEMPLATE = `{
  "text": "{{data.user.name}} is watching {{data.item.name}} on {{server.name}}"
}`;

export const emptyWebhook = (): EventWebhook => ({
  name: "",
  url: "",
  type: "discord",
  events: ["playback.started"],
  serverId: null,
  enabled: true,
  headers: {},
  payloadTemplate: null,
  secret: null,
});

/** Create or edit an event webhook. Admin only. */
export default function WebhookEditor({ webhook, events, servers, onClose, onSaved }: Props) {
  const { t } = useTranslation("common");
  const [draft, setDraft] = useState<EventWebhook>(webhook);
  const [headers, setHeaders] = useState<[string, string][]>(Object.entries(webhook.headers ?? {}));
  const [useTemplate, setUseTemplate] = useState(!!webhook.payloadTemplate);
  const [saving, setSaving] = useState(false);

  const set = (patch: Partial<EventWebhook>) => setDraft((d) => ({ ...d, ...patch }));
  const toggleEvent = (key: WebhookEventKey, on: boolean) =>
    set({ events: on ? [...draft.events, key] : draft.events.filter((e) => e !== key) });

  const typeLabels: Record<EventWebhookType, string> = {
    discord: t("settings.webhook_type_discord", "Discord"),
    generic: t("settings.webhook_type_generic", "Generic JSON"),
  };
  const serverLabel = (id: string) =>
    id === ALL_SERVERS
      ? t("settings.webhook_all_servers", "All servers")
      : (servers.find((s) => s.id === id)?.name ?? id);
  const sample = events.find((e) => e.key === draft.events[0])?.sample ?? events[0]?.sample;

  async function save() {
    setSaving(true);
    try {
      await client.Webhooks.save({
        ...draft,
        name: draft.name.trim(),
        headers: Object.fromEntries(headers.filter(([k]) => k.trim())),
        payloadTemplate: useTemplate ? draft.payloadTemplate || null : null,
      });
      toast.success(t("settings.webhook_saved", "Webhook saved"));
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? t("settings.error_save_webhook", "Failed to save the webhook"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalPanel size="xl">
      <ModalHeader
        icon={<Webhook size={22} />}
        title={webhook.id ? t("settings.edit_webhook", "Edit webhook") : t("settings.add_webhook", "New webhook")}
      />

      <div className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={t("settings.webhook_name", "Name")} htmlFor="webhook-name">
            <Input id="webhook-name" value={draft.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <Field label={t("settings.webhook_type", "Type")}>
            <Select<EventWebhookType>
              data={[{ value: "discord" }, { value: "generic" }]}
              value={draft.type}
              onChange={(v) => set({ type: v })}
              labelFn={(v) => typeLabels[v]}
              widthPx={0}
              className="w-full"
            />
          </Field>
        </div>

        <Field label={t("settings.webhook_url", "URL")} htmlFor="webhook-url">
          <Input
            id="webhook-url"
            value={draft.url}
            placeholder={draft.type === "discord" ? "https://discord.com/api/webhooks/..." : "https://example.com/hooks/jellystat"}
            onChange={(e) => set({ url: e.target.value.trim() })}
          />
        </Field>

        <Field label={t("settings.webhook_events", "Events")}>
          <div className="grid gap-2 sm:grid-cols-3">
            {events.map((e) => (
              <Checkbox
                key={e.key}
                variant="card"
                checked={draft.events.includes(e.key)}
                onChange={(ev) => toggleEvent(e.key, ev.target.checked)}
                label={e.label}
                description={e.description}
              />
            ))}
          </div>
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={t("settings.webhook_server", "Server")}>
            <Select<string>
              data={[{ value: ALL_SERVERS }, ...servers.map((s) => ({ value: s.id }))]}
              value={draft.serverId ?? ALL_SERVERS}
              onChange={(v) => set({ serverId: v === ALL_SERVERS ? null : v })}
              labelFn={serverLabel}
              widthPx={0}
              className="w-full"
            />
          </Field>
          {draft.type === "generic" && (
            <Field
              label={
                draft.hasSecret
                  ? t("settings.webhook_secret_saved", "Signing secret (saved; type to replace, clear and save to remove)")
                  : t("settings.webhook_secret", "Signing secret (optional)")
              }
              htmlFor="webhook-secret"
            >
              <Input
                id="webhook-secret"
                value={draft.secret ?? ""}
                placeholder={draft.hasSecret ? "••••••••" : "X-Jellystat-Signature: sha256=HMAC(body)"}
                onChange={(e) => set({ secret: e.target.value })}
              />
            </Field>
          )}
        </div>

        {draft.type === "generic" && (
          <Field label={t("settings.webhook_headers", "Headers")}>
            <div className="space-y-2">
              {headers.map(([key, value], i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={key}
                    placeholder="Authorization"
                    onChange={(e) => setHeaders(headers.map((h, j) => (j === i ? [e.target.value, h[1]] : h)))}
                    wrapperClassName="flex-1"
                  />
                  <Input
                    value={value}
                    placeholder="Bearer ..."
                    onChange={(e) => setHeaders(headers.map((h, j) => (j === i ? [h[0], e.target.value] : h)))}
                    wrapperClassName="flex-1"
                  />
                  <IconButton
                    label={t("common.delete", "Delete")}
                    onClick={() => setHeaders(headers.filter((_, j) => j !== i))}
                    className="hover:text-danger"
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={() => setHeaders([...headers, ["", ""]])}>
                <Plus size={14} className="text-primary" />
                {t("settings.webhook_add_header", "Add header")}
              </Button>
            </div>
          </Field>
        )}

        <Switch
          label={t("settings.webhook_custom_payload", "Custom payload")}
          checked={useTemplate}
          onChange={(v) => {
            setUseTemplate(v);
            if (v && !draft.payloadTemplate) {
              set({
                payloadTemplate: draft.type === "discord" ? DEFAULT_TEMPLATE.replace('"text"', '"content"') : DEFAULT_TEMPLATE,
              });
            }
          }}
        />
        {useTemplate && (
          <div className="space-y-2">
            <Textarea
              rows={6}
              className="font-mono text-xs"
              value={draft.payloadTemplate ?? ""}
              onChange={(e) => set({ payloadTemplate: e.target.value })}
            />
            <p className="text-[11px] text-gray-500">
              {t(
                "settings.webhook_template_help",
                "Tokens like {{data.user.name}} or {{data.items.0.name}} are paths into the payload below. Text is JSON-escaped, so put text tokens inside quotes; numbers and objects go in as JSON.",
                // The help text shows literal {{tokens}}, so move i18next's own markers out of the way
                { interpolation: { prefix: "{{{", suffix: "}}}" } },
              )}
            </p>
            {sample !== undefined && (
              <pre className="max-h-56 overflow-auto rounded-xl border border-border bg-background p-4 text-[11px] text-gray-400 shadow-inner">
                {JSON.stringify(sample, null, 2)}
              </pre>
            )}
          </div>
        )}

        <Switch label={t("settings.webhook_enabled", "Enabled")} checked={draft.enabled} onChange={(v) => set({ enabled: v })} />
      </div>

      <ModalFooter className="pt-6">
        <Button variant="secondary" onClick={onClose}>
          {t("common.cancel", "Cancel")}
        </Button>
        <Button onClick={save} loading={saving} disabled={!draft.name.trim() || !draft.url || draft.events.length === 0}>
          {t("settings.save_webhook", "Save webhook")}
        </Button>
      </ModalFooter>
    </ModalPanel>
  );
}
