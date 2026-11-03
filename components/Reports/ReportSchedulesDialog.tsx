import clsx from "clsx";
import { AlertCircle, CalendarClock, CheckCircle2, Pencil, Play, Plus, Trash2, Webhook, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import client from "@/lib/api";
import { formatDateTime } from "@/lib/dateFormat";
import type { ExportFormat, ReportParameter, ReportSchedule, WebhookType } from "@/lib/models/reports";
import { Field, NumberInput, Select, TextInput, Toggle } from "./designer/controls";
import ParameterInput from "./ParameterInput";
import { Badge, ConfirmButton, Modal, ModalPanel, ModalTitle, Spinner } from "@/components/ui";

interface Props {
  reportId: string;
  reportName: string;
  parameters: ReportParameter[];
  onClose: () => void;
}

const emptySchedule = (reportId: string, reportName: string, nameSuffix: string): ReportSchedule => ({
  reportId,
  name: `${reportName} ${nameSuffix}`,
  enabled: true,
  intervalMinutes: 1440,
  format: "pdf",
  webhookUrl: "",
  webhookType: "discord",
  webhookSecret: null,
  message: "{{report.name}} for {{now|date}}",
  parameters: {},
});

/** Scheduled and on-demand delivery of a saved report to webhooks. Admin only. */
export default function ReportSchedulesDialog({ reportId, reportName, parameters, onClose }: Props) {
  const { t } = useTranslation("common");
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ReportSchedule | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const INTERVALS = [
    { value: "60", label: t("reports.schedule_every_hour", "Every hour") },
    { value: "360", label: t("reports.schedule_every_6_hours", "Every 6 hours") },
    { value: "1440", label: t("reports.schedule_every_day", "Every day") },
    { value: "10080", label: t("reports.schedule_every_week", "Every week") },
    { value: "43200", label: t("reports.schedule_every_30_days", "Every 30 days") },
    { value: "0", label: t("reports.schedule_manual_only", "Manual only") },
    { value: "custom", label: t("reports.schedule_custom", "Custom...") },
  ];

  const FORMATS: { value: ExportFormat; label: string }[] = [
    { value: "pdf", label: "PDF" },
    { value: "png", label: t("reports.format_png", "PNG image") },
    { value: "html", label: t("reports.format_html", "HTML page") },
    { value: "svg", label: "SVG" },
    { value: "json", label: t("reports.format_json", "JSON data") },
  ];

  const WEBHOOK_TYPES: { value: WebhookType; label: string; help: string }[] = [
    {
      value: "discord",
      label: "Discord",
      help: t("reports.webhook_discord_help", "Posts the message with the file attached."),
    },
    {
      value: "generic",
      label: t("reports.webhook_generic", "Generic (multipart)"),
      help: t("reports.webhook_generic_help", "multipart/form-data with a JSON 'payload' part and the 'file'."),
    },
    {
      value: "json",
      label: "JSON",
      help: t(
        "reports.webhook_json_help",
        "application/json with metadata and the file as base64 (or the data rows for JSON).",
      ),
    },
  ];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSchedules(await client.Reports.schedules.list({ ReportId: reportId }));
    } catch (err: any) {
      toast.error(err?.message ?? t("reports.schedules_load_failed", "Failed to load schedules"));
    } finally {
      setLoading(false);
    }
  }, [reportId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!editing) {
      return;
    }
    setBusy("save");
    try {
      await client.Reports.schedules.save(editing);
      toast.success(t("reports.schedule_saved", "Schedule saved"));
      setEditing(null);
      await load();
    } catch (err: any) {
      toast.error(err?.message ?? t("reports.schedule_save_failed", "Failed to save the schedule"));
    } finally {
      setBusy(null);
    }
  };

  const run = async (id: string) => {
    setBusy(id);
    try {
      const result = await client.Reports.schedules.run({ Id: id });
      if (result.success) {
        toast.success(
          t("reports.schedule_delivered", "Delivered {{fileName}} in {{ms}} ms", {
            fileName: result.fileName ?? "",
            ms: result.elapsedMs,
          }),
        );
      } else {
        toast.error(result.error ?? t("reports.schedule_delivery_failed", "Delivery failed"));
      }
      await load();
    } catch (err: any) {
      toast.error(err?.message ?? t("reports.schedule_delivery_failed", "Delivery failed"));
    } finally {
      setBusy(null);
    }
  };

  const remove = async (id: string) => {
    setBusy(id);
    try {
      await client.Reports.schedules.delete({ Id: id });
      await load();
    } catch (err: any) {
      toast.error(err?.message ?? t("reports.schedule_delete_failed", "Failed to delete the schedule"));
    } finally {
      setBusy(null);
    }
  };

  const intervalValue = (m: number) => (INTERVALS.some((i) => i.value === String(m)) ? String(m) : "custom");
  const set = (patch: Partial<ReportSchedule>) => setEditing((s) => (s ? { ...s, ...patch } : s));

  return (
    <Modal open onClose={onClose}>
        <ModalPanel className="p-0 md:p-0 max-w-3xl max-h-[92dvh] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <ModalTitle className="flex items-center gap-2 text-lg font-black text-white">
              <CalendarClock size={20} className="text-accent" /> {t("reports.schedules_title", "Schedules & webhooks")}
            </ModalTitle>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-white cursor-pointer"
              aria-label={t("common.close", "Close")}
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {!editing && (
              <>
                <p className="text-sm text-gray-400">
                  {t(
                    "reports.schedules_intro",
                    "Render {{name}} on the server and post it to a webhook on a schedule, or run one now to test it. Automations can also call the export endpoint below with an API key.",
                    { name: reportName },
                  )}{" "}
                  <code className="text-gray-300 break-all">GET /Reports/Export?Id={reportId}&amp;Format=pdf</code>
                </p>
                {loading && <Spinner className="text-primary" />}
                {!loading && schedules.length === 0 && (
                  <p className="text-sm text-gray-500">{t("reports.no_schedules", "No schedules yet.")}</p>
                )}
                <div className="space-y-2">
                  {schedules.map((s) => (
                    <div key={s.id} className="rounded-xl border border-border bg-background p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Webhook size={14} className="text-accent shrink-0" />
                          <span className="font-bold text-sm text-white truncate">{s.name}</span>
                          <Badge tone={s.enabled ? "success" : "neutral"} shape="square">
                            {s.enabled ? t("reports.schedule_on", "on") : t("reports.schedule_off", "off")}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-3">
                          <span>
                            {s.format.toUpperCase()} → {s.webhookType}
                          </span>
                          <span>
                            {INTERVALS.find((i) => i.value === String(s.intervalMinutes))?.label ??
                              t("reports.schedule_every_n_min", "Every {{n}} min", { n: s.intervalMinutes })}
                          </span>
                          {s.nextRunAt && s.enabled && s.intervalMinutes > 0 && (
                            <span>{t("reports.schedule_next", "Next {{date}}", { date: formatDateTime(s.nextRunAt) })}</span>
                          )}
                          {s.lastRunAt && (
                            <span
                              className={clsx("flex items-center gap-1", s.lastSuccess ? "text-success" : "text-danger")}
                              title={s.lastError ?? undefined}
                            >
                              {s.lastSuccess ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                              {t("reports.schedule_last", "Last {{date}}", { date: formatDateTime(s.lastRunAt) })}
                            </span>
                          )}
                        </div>
                        {s.lastSuccess === false && s.lastError && <p className="text-[11px] text-danger mt-1 break-words">{s.lastError}</p>}
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          type="button"
                          disabled={busy !== null}
                          onClick={() => run(s.id!)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs text-gray-300 hover:text-white hover:border-accent cursor-pointer disabled:opacity-50"
                        >
                          {busy === s.id ? <Spinner size={13} className="" /> : <Play size={13} />}{" "}
                          {t("reports.schedule_run_now", "Run now")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditing({ ...s, webhookSecret: null })}
                          className="p-1.5 rounded-lg border border-border text-gray-400 hover:text-white cursor-pointer"
                          aria-label={t("common.edit", "Edit")}
                        >
                          <Pencil size={13} />
                        </button>
                        <ConfirmButton
                          disabled={busy !== null}
                          onConfirm={() => remove(s.id!)}
                          tone="danger"
                          tooltip={t("common.delete", "Delete")}
                          title={t("reports.schedule_delete_title", "Delete this schedule?")}
                          description={t("reports.schedule_delete_desc", "{{name}} will stop being delivered.", { name: s.name })}
                          confirmText={t("common.delete", "Delete")}
                          cancelText={t("common.cancel", "Cancel")}
                          className="p-1.5 rounded-lg border border-border text-gray-400 hover:text-danger cursor-pointer"
                        >
                          <Trash2 size={13} />
                          <span className="sr-only">{t("common.delete", "Delete")}</span>
                        </ConfirmButton>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(emptySchedule(reportId, reportName, t("reports.schedule_name_suffix", "delivery")))}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-background hover:border-accent text-sm font-bold text-gray-200 cursor-pointer"
                >
                  <Plus size={16} className="text-accent" /> {t("reports.new_schedule", "New schedule")}
                </button>
              </>
            )}

            {editing && (
              <div className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label={t("reports.schedule_name", "Name")}>
                    <TextInput value={editing.name} onChange={(v) => set({ name: v })} />
                  </Field>
                  <Field label={t("reports.schedule_repeat", "Repeat")}>
                    <div className="flex gap-2">
                      <Select
                        value={intervalValue(editing.intervalMinutes)}
                        options={INTERVALS}
                        onChange={(v) => set({ intervalMinutes: v === "custom" ? 120 : Number(v) })}
                      />
                      {intervalValue(editing.intervalMinutes) === "custom" && (
                        <div className="w-28 shrink-0">
                          <NumberInput value={editing.intervalMinutes} min={5} onChange={(v) => set({ intervalMinutes: v ?? 60 })} />
                        </div>
                      )}
                    </div>
                  </Field>
                  <Field label={t("reports.schedule_webhook_type", "Webhook type")}>
                    <Select
                      value={editing.webhookType}
                      options={WEBHOOK_TYPES.map((w) => ({ value: w.value, label: w.label }))}
                      onChange={(v) => set({ webhookType: v })}
                    />
                  </Field>
                  <Field label={t("reports.schedule_format", "File format")}>
                    <Select value={editing.format} options={FORMATS} onChange={(v) => set({ format: v })} />
                  </Field>
                </div>
                <p className="text-[11px] text-gray-500 -mt-1">{WEBHOOK_TYPES.find((w) => w.value === editing.webhookType)?.help}</p>
                <Field label={t("reports.schedule_webhook_url", "Webhook URL")}>
                  <TextInput
                    value={editing.webhookUrl}
                    placeholder="https://discord.com/api/webhooks/..."
                    onChange={(v) => set({ webhookUrl: v.trim() })}
                  />
                </Field>
                {editing.webhookType !== "discord" && (
                  <Field
                    label={
                      editing.hasSecret
                        ? t(
                            "reports.schedule_secret_saved",
                            "Signing secret (saved; type to replace, clear the box and save to remove)",
                          )
                        : t("reports.schedule_secret_optional", "Signing secret (optional)")
                    }
                  >
                    <TextInput
                      value={editing.webhookSecret ?? ""}
                      placeholder={editing.hasSecret ? "••••••••" : "Adds X-Jellystat-Signature: sha256=HMAC(body)"}
                      onChange={(v) => set({ webhookSecret: v })}
                    />
                  </Field>
                )}
                <Field label={t("reports.schedule_message", "Message")}>
                  <TextInput multiline rows={2} value={editing.message ?? ""} onChange={(v) => set({ message: v || null })} />
                </Field>
                {parameters.length > 0 && (
                  <Field label={t("reports.schedule_parameters", "Parameters")}>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {parameters.map((p) => (
                        <div key={p.name} className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 w-24 truncate">{p.label || p.name}</span>
                          <ParameterInput
                            parameter={p}
                            className="flex-1"
                            source={{ reportId }}
                            values={editing.parameters ?? {}}
                            emptyLabel={p.type === "lookup" ? t("common.all", "All") : t("reports.parameter_default", "Default")}
                            value={editing.parameters?.[p.name] ?? null}
                            onChange={(v) => {
                              const next = { ...(editing.parameters ?? {}) };
                              if (v === null || v === undefined) {
                                delete next[p.name];
                              } else {
                                next[p.name] = v;
                              }
                              set({ parameters: next });
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </Field>
                )}
                <Toggle label={t("reports.schedule_enabled", "Enabled")} checked={editing.enabled} onChange={(v) => set({ enabled: v })} />
              </div>
            )}
          </div>

          {editing && (
            <div className="flex justify-end gap-3 px-5 py-3 border-t border-border">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-lg bg-background border border-border text-gray-200 hover:text-white text-sm cursor-pointer"
              >
                {t("common.back", "Back")}
              </button>
              <button
                type="button"
                onClick={save}
                disabled={busy !== null || !editing.name.trim() || !editing.webhookUrl}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-solid hover:bg-primary-solid-hover text-white text-sm font-bold cursor-pointer disabled:opacity-50"
              >
                {busy === "save" && <Spinner size={14} className="" />} {t("reports.save_schedule", "Save schedule")}
              </button>
            </div>
          )}
        </ModalPanel>
    </Modal>
  );
}
