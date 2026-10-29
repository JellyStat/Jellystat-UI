import { DialogPanel, DialogTitle } from "@headlessui/react";
import { Loader2, Plus, Trash2, Webhook, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Field, Select, TextInput, Toggle } from "@/components/Reports/designer/controls";
import client from "@/lib/api";
import type { Server } from "@/lib/models/server";
import type { EventWebhook, EventWebhookType, WebhookEventInfo, WebhookEventKey } from "@/lib/models/webhooks";

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

  const typeOptions: { value: EventWebhookType; label: string }[] = [
    { value: "discord", label: t("settings.webhook_type_discord", "Discord") },
    { value: "generic", label: t("settings.webhook_type_generic", "Generic JSON") },
  ];
  const serverOptions = [
    { value: ALL_SERVERS, label: t("settings.webhook_all_servers", "All servers") },
    ...servers.map((s) => ({ value: s.id, label: s.name })),
  ];
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
    <DialogPanel className="w-full max-w-3xl max-h-[92dvh] flex flex-col rounded-2xl border border-border bg-surface shadow-2xl shadow-black/40 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <DialogTitle className="flex items-center gap-2 text-lg font-black text-white">
          <Webhook size={20} className="text-brand-cyan" />
          {webhook.id ? t("settings.edit_webhook", "Edit webhook") : t("settings.add_webhook", "New webhook")}
        </DialogTitle>
        <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-white cursor-pointer" aria-label="Close">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label={t("settings.webhook_name", "Name")}>
            <TextInput value={draft.name} onChange={(v) => set({ name: v })} />
          </Field>
          <Field label={t("settings.webhook_type", "Type")}>
            <Select value={draft.type} options={typeOptions} onChange={(v) => set({ type: v })} />
          </Field>
        </div>
        <Field label={t("settings.webhook_url", "URL")}>
          <TextInput
            value={draft.url}
            placeholder={draft.type === "discord" ? "https://discord.com/api/webhooks/..." : "https://example.com/hooks/jellystat"}
            onChange={(v) => set({ url: v.trim() })}
          />
        </Field>

        <Field label={t("settings.webhook_events", "Events")}>
          <div className="grid gap-2 sm:grid-cols-3">
            {events.map((e) => (
              <label
                key={e.key}
                className="flex items-start gap-2 rounded-lg border border-border bg-background p-2.5 cursor-pointer hover:border-brand-cyan/60"
              >
                <input
                  type="checkbox"
                  checked={draft.events.includes(e.key)}
                  onChange={(ev) => toggleEvent(e.key, ev.target.checked)}
                  className="accent-brand-purple mt-0.5 cursor-pointer"
                />
                <span className="min-w-0">
                  <span className="block text-xs font-bold text-gray-200">{e.label}</span>
                  <span className="block text-[11px] text-gray-500 normal-case tracking-normal font-normal">{e.description}</span>
                </span>
              </label>
            ))}
          </div>
        </Field>

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label={t("settings.webhook_server", "Server")}>
            <Select
              value={draft.serverId ?? ALL_SERVERS}
              options={serverOptions}
              onChange={(v) => set({ serverId: v === ALL_SERVERS ? null : v })}
            />
          </Field>
          {draft.type === "generic" && (
            <Field
              label={
                draft.hasSecret
                  ? t("settings.webhook_secret_saved", "Signing secret (saved; type to replace, clear and save to remove)")
                  : t("settings.webhook_secret", "Signing secret (optional)")
              }
            >
              <TextInput
                value={draft.secret ?? ""}
                placeholder={draft.hasSecret ? "••••••••" : "X-Jellystat-Signature: sha256=HMAC(body)"}
                onChange={(v) => set({ secret: v })}
              />
            </Field>
          )}
        </div>

        {draft.type === "generic" && (
          <Field label={t("settings.webhook_headers", "Headers")}>
            <div className="space-y-1.5">
              {headers.map(([key, value], i) => (
                <div key={i} className="flex gap-2">
                  <TextInput
                    value={key}
                    placeholder="Authorization"
                    onChange={(v) => setHeaders(headers.map((h, j) => (j === i ? [v, h[1]] : h)))}
                  />
                  <TextInput
                    value={value}
                    placeholder="Bearer ..."
                    onChange={(v) => setHeaders(headers.map((h, j) => (j === i ? [h[0], v] : h)))}
                  />
                  <button
                    type="button"
                    onClick={() => setHeaders(headers.filter((_, j) => j !== i))}
                    className="p-1.5 rounded-md border border-border text-gray-400 hover:text-brand-rose cursor-pointer"
                    aria-label={t("common.delete", "Delete")}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setHeaders([...headers, ["", ""]])}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-white cursor-pointer"
              >
                <Plus size={12} className="text-brand-cyan" /> {t("settings.webhook_add_header", "Add header")}
              </button>
            </div>
          </Field>
        )}

        <Toggle
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
            <TextInput multiline rows={6} value={draft.payloadTemplate ?? ""} onChange={(v) => set({ payloadTemplate: v })} />
            <p className="text-[11px] text-gray-500">
              {t(
                "settings.webhook_template_help",
                "Tokens like {{data.user.name}} or {{data.items.0.name}} are paths into the payload below. Text is JSON-escaped, so put text tokens inside quotes; numbers and objects go in as JSON.",
                // The help text shows literal {{tokens}}, so move i18next's own markers out of the way
                { interpolation: { prefix: "{{{", suffix: "}}}" } },
              )}
            </p>
            {sample !== undefined && (
              <pre className="max-h-56 overflow-auto rounded-lg border border-border bg-background p-3 text-[11px] text-gray-400">
                {JSON.stringify(sample, null, 2)}
              </pre>
            )}
          </div>
        )}

        <Toggle label={t("settings.webhook_enabled", "Enabled")} checked={draft.enabled} onChange={(v) => set({ enabled: v })} />
      </div>

      <div className="flex justify-end gap-3 px-5 py-3 border-t border-border">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-background border border-border text-gray-200 hover:text-white text-sm cursor-pointer"
        >
          {t("common.cancel", "Cancel")}
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving || !draft.name.trim() || !draft.url || draft.events.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-cyan text-white text-sm font-bold cursor-pointer disabled:opacity-50"
        >
          {saving && <Loader2 size={14} className="animate-spin" />} {t("settings.save_webhook", "Save webhook")}
        </button>
      </div>
    </DialogPanel>
  );
}
