import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import clsx from "clsx";
import { AlertCircle, CalendarClock, CheckCircle2, Loader2, Pencil, Play, Plus, Trash2, Webhook, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import client from "@/lib/api";
import { formatDateTime } from "@/lib/dateFormat";
import type { ExportFormat, ReportParameter, ReportSchedule, WebhookType } from "@/lib/models/reports";
import { Field, NumberInput, Select, TextInput, Toggle } from "./designer/controls";

interface Props {
  reportId: string;
  reportName: string;
  parameters: ReportParameter[];
  onClose: () => void;
}

const INTERVALS = [
  { value: "60", label: "Every hour" },
  { value: "360", label: "Every 6 hours" },
  { value: "1440", label: "Every day" },
  { value: "10080", label: "Every week" },
  { value: "43200", label: "Every 30 days" },
  { value: "0", label: "Manual only" },
  { value: "custom", label: "Custom..." },
];

const FORMATS: { value: ExportFormat; label: string }[] = [
  { value: "pdf", label: "PDF" },
  { value: "png", label: "PNG image" },
  { value: "html", label: "HTML page" },
  { value: "svg", label: "SVG" },
  { value: "json", label: "JSON data" },
];

const WEBHOOK_TYPES: { value: WebhookType; label: string; help: string }[] = [
  { value: "discord", label: "Discord", help: "Posts the message with the file attached." },
  {
    value: "generic",
    label: "Generic (multipart)",
    help: "multipart/form-data with a JSON 'payload' part and the 'file'.",
  },
  {
    value: "json",
    label: "JSON",
    help: "application/json with metadata and the file as base64 (or the data rows for JSON).",
  },
];

const emptySchedule = (reportId: string, reportName: string): ReportSchedule => ({
  reportId,
  name: `${reportName} delivery`,
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
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ReportSchedule | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSchedules(await client.Reports.schedules.list({ ReportId: reportId }));
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to load schedules");
    } finally {
      setLoading(false);
    }
  }, [reportId]);

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
      toast.success("Schedule saved");
      setEditing(null);
      await load();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save the schedule");
    } finally {
      setBusy(null);
    }
  };

  const run = async (id: string) => {
    setBusy(id);
    try {
      const result = await client.Reports.schedules.run({ Id: id });
      if (result.success) {
        toast.success(`Delivered ${result.fileName ?? ""} in ${result.elapsedMs} ms`);
      } else {
        toast.error(result.error ?? "Delivery failed");
      }
      await load();
    } catch (err: any) {
      toast.error(err?.message ?? "Delivery failed");
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
      toast.error(err?.message ?? "Failed to delete the schedule");
    } finally {
      setBusy(null);
    }
  };

  const intervalValue = (m: number) => (INTERVALS.some((i) => i.value === String(m)) ? String(m) : "custom");
  const set = (patch: Partial<ReportSchedule>) => setEditing((s) => (s ? { ...s, ...patch } : s));

  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-6">
        <DialogPanel className="w-full max-w-3xl max-h-[92dvh] flex flex-col rounded-2xl border border-border bg-surface shadow-2xl shadow-black/40 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-lg font-black text-white">
              <CalendarClock size={20} className="text-brand-cyan" /> Schedules & webhooks
            </DialogTitle>
            <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-white cursor-pointer" aria-label="Close">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {!editing && (
              <>
                <p className="text-sm text-gray-400">
                  Render <span className="text-white font-bold">{reportName}</span> on the server and post it to a webhook on a schedule, or run one
                  now to test it. Automations can also call <code className="text-gray-300">GET /Reports/Export?Id={reportId}&amp;Format=pdf</code>{" "}
                  with an API key.
                </p>
                {loading && <Loader2 className="animate-spin text-brand-cyan" />}
                {!loading && schedules.length === 0 && <p className="text-sm text-gray-500">No schedules yet.</p>}
                <div className="space-y-2">
                  {schedules.map((s) => (
                    <div key={s.id} className="rounded-xl border border-border bg-background p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Webhook size={14} className="text-brand-cyan shrink-0" />
                          <span className="font-bold text-sm text-white truncate">{s.name}</span>
                          <span
                            className={clsx(
                              "text-[10px] uppercase tracking-wider px-1.5 rounded border",
                              s.enabled ? "text-brand-emerald border-brand-emerald/30" : "text-gray-500 border-border",
                            )}
                          >
                            {s.enabled ? "on" : "off"}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-3">
                          <span>
                            {s.format.toUpperCase()} → {s.webhookType}
                          </span>
                          <span>{INTERVALS.find((i) => i.value === String(s.intervalMinutes))?.label ?? `Every ${s.intervalMinutes} min`}</span>
                          {s.nextRunAt && s.enabled && s.intervalMinutes > 0 && <span>Next {formatDateTime(s.nextRunAt)}</span>}
                          {s.lastRunAt && (
                            <span
                              className={clsx("flex items-center gap-1", s.lastSuccess ? "text-brand-emerald" : "text-brand-rose")}
                              title={s.lastError ?? undefined}
                            >
                              {s.lastSuccess ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                              Last {formatDateTime(s.lastRunAt)}
                            </span>
                          )}
                        </div>
                        {s.lastSuccess === false && s.lastError && <p className="text-[11px] text-brand-rose mt-1 break-words">{s.lastError}</p>}
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          type="button"
                          disabled={busy !== null}
                          onClick={() => run(s.id!)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs text-gray-300 hover:text-white hover:border-brand-cyan cursor-pointer disabled:opacity-50"
                        >
                          {busy === s.id ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />} Run now
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditing({ ...s, webhookSecret: null })}
                          className="p-1.5 rounded-lg border border-border text-gray-400 hover:text-white cursor-pointer"
                          aria-label="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          disabled={busy !== null}
                          onClick={() => remove(s.id!)}
                          className="p-1.5 rounded-lg border border-border text-gray-400 hover:text-brand-rose cursor-pointer disabled:opacity-50"
                          aria-label="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(emptySchedule(reportId, reportName))}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-background hover:border-brand-cyan text-sm font-bold text-gray-200 cursor-pointer"
                >
                  <Plus size={16} className="text-brand-cyan" /> New schedule
                </button>
              </>
            )}

            {editing && (
              <div className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Name">
                    <TextInput value={editing.name} onChange={(v) => set({ name: v })} />
                  </Field>
                  <Field label="Repeat">
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
                  <Field label="Webhook type">
                    <Select
                      value={editing.webhookType}
                      options={WEBHOOK_TYPES.map((w) => ({ value: w.value, label: w.label }))}
                      onChange={(v) => set({ webhookType: v })}
                    />
                  </Field>
                  <Field label="File format">
                    <Select value={editing.format} options={FORMATS} onChange={(v) => set({ format: v })} />
                  </Field>
                </div>
                <p className="text-[11px] text-gray-500 -mt-1">{WEBHOOK_TYPES.find((w) => w.value === editing.webhookType)?.help}</p>
                <Field label="Webhook URL">
                  <TextInput
                    value={editing.webhookUrl}
                    placeholder="https://discord.com/api/webhooks/..."
                    onChange={(v) => set({ webhookUrl: v.trim() })}
                  />
                </Field>
                {editing.webhookType !== "discord" && (
                  <Field
                    label={
                      editing.hasSecret ? "Signing secret (saved; type to replace, clear the box and save to remove)" : "Signing secret (optional)"
                    }
                  >
                    <TextInput
                      value={editing.webhookSecret ?? ""}
                      placeholder={editing.hasSecret ? "••••••••" : "Adds X-Jellystat-Signature: sha256=HMAC(body)"}
                      onChange={(v) => set({ webhookSecret: v })}
                    />
                  </Field>
                )}
                <Field label="Message">
                  <TextInput multiline rows={2} value={editing.message ?? ""} onChange={(v) => set({ message: v || null })} />
                </Field>
                {parameters.length > 0 && (
                  <Field label="Parameters">
                    <div className="grid sm:grid-cols-2 gap-2">
                      {parameters.map((p) => (
                        <div key={p.name} className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 w-24 truncate">{p.label || p.name}</span>
                          <TextInput
                            value={editing.parameters?.[p.name] === undefined ? "" : String(editing.parameters[p.name])}
                            placeholder={p.defaultValue === null || p.defaultValue === undefined ? "default" : String(p.defaultValue)}
                            onChange={(v) => {
                              const next = { ...(editing.parameters ?? {}) };
                              if (v === "") {
                                delete next[p.name];
                              } else {
                                next[p.name] =
                                  p.type === "number" && Number.isFinite(Number(v)) ? Number(v) : p.type === "boolean" ? v === "true" : v;
                              }
                              set({ parameters: next });
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </Field>
                )}
                <Toggle label="Enabled" checked={editing.enabled} onChange={(v) => set({ enabled: v })} />
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
                Back
              </button>
              <button
                type="button"
                onClick={save}
                disabled={busy !== null || !editing.name.trim() || !editing.webhookUrl}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-cyan text-white text-sm font-bold cursor-pointer disabled:opacity-50"
              >
                {busy === "save" && <Loader2 size={14} className="animate-spin" />} Save schedule
              </button>
            </div>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
