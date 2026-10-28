import React, { useState } from "react";
import { AlertCircle, Check, Copy, Eye, KeyRound, Loader2, ShieldCheck, TriangleAlert } from "lucide-react";
import { DialogPanel, DialogTitle } from "@headlessui/react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import client from "@/lib/api";
import Permissions from "@/lib/models/enums/Permissions";
import type { CreatedApiKey } from "@/lib/models/apiKey";
import type { Server } from "@/lib/models/server";

type Props = {
  servers: Server[];
  onClose: () => void;
  onCreated?: () => void;
};

export default function CreateApiKeyModal({ servers, onClose, onCreated }: Props) {
  const { t } = useTranslation("common");

  const [name, setName] = useState("");
  const [permission, setPermission] = useState<Permissions>(Permissions.CanView);
  const [serverId, setServerId] = useState(servers[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; serverId?: string }>({});
  const [created, setCreated] = useState<CreatedApiKey | null>(null);
  const [copied, setCopied] = useState(false);

  const isReadOnly = permission === Permissions.CanView;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const nextFieldErrors: typeof fieldErrors = {};
    if (!name.trim()) nextFieldErrors.name = t("settings.error_api_key_name_required", "A name is required");
    if (isReadOnly && !serverId)
      nextFieldErrors.serverId = t("settings.error_api_key_server_required", "Select a server for this key");
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) return;

    setLoading(true);
    try {
      const result = await client.ApiKeys.create({
        name: name.trim(),
        permission,
        serverId: isReadOnly ? serverId : undefined,
      });
      setCreated(result);
      onCreated?.();
    } catch (err: any) {
      const message = err?.message ?? t("settings.error_create_api_key", "Failed to create API key");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function copyKey() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("settings.error_copy_api_key", "Could not copy. Select the key and copy it manually."));
    }
  }

  const panelClass =
    "w-full max-w-lg rounded-2xl border border-border bg-surface p-5 md:p-6 shadow-2xl shadow-black/40 duration-100 ease-out data-closed:transform-[scale(95%)] data-closed:opacity-0";
  const inputClass = (invalid: boolean) =>
    `w-full bg-background border rounded-xl py-3 px-4 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 transition-all shadow-inner ${
      invalid
        ? "border-brand-rose focus:border-brand-rose focus:ring-brand-rose/50"
        : "border-border hover:border-gray-500 focus:border-brand-cyan focus:ring-brand-cyan"
    }`;

  if (created) {
    return (
      <DialogPanel transition className={panelClass}>
        <DialogTitle className="text-lg font-black text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-brand-emerald/10 border border-brand-emerald/20">
              <KeyRound size={22} className="text-brand-emerald" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              {t("settings.api_key_created", "API key created")}
            </h2>
          </div>
        </DialogTitle>

        <div className="p-3.5 rounded-xl bg-brand-amber/10 border border-brand-amber/30 flex items-start gap-3 mb-4">
          <TriangleAlert size={16} className="text-brand-amber shrink-0 mt-0.5" />
          <p className="text-xs text-brand-amber font-medium leading-relaxed">
            {t(
              "settings.api_key_copy_warning",
              "Copy this key now. It is only shown once and cannot be retrieved later. If you lose it, delete the key and create a new one.",
            )}
          </p>
        </div>

        <div className="flex items-stretch gap-2">
          <code className="flex-1 min-w-0 break-all bg-background border border-border rounded-xl px-4 py-3 text-sm text-gray-200 select-all">
            {created.key}
          </code>
          <button
            type="button"
            onClick={copyKey}
            className="px-4 rounded-xl bg-background border border-border text-gray-200 hover:text-white hover:border-gray-500 transition-all flex items-center gap-2 text-sm font-bold"
          >
            {copied ? <Check size={16} className="text-brand-emerald" /> : <Copy size={16} />}
            {copied ? t("common.copied", "Copied") : t("common.copy", "Copy")}
          </button>
        </div>

        <p className="mt-4 text-xs text-gray-500">
          {t("settings.api_key_usage", "Send it in the x-api-token header with each request.")}
        </p>

        <div className="flex justify-end pt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-brand-cyan text-black font-black transition-all active:scale-[0.98]"
          >
            {t("common.done", "Done")}
          </button>
        </div>
      </DialogPanel>
    );
  }

  return (
    <DialogPanel transition className={panelClass}>
      <DialogTitle className="text-lg font-black text-white">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20">
                <KeyRound size={22} className="text-brand-cyan" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                {t("settings.add_api_key", "Create API Key")}
              </h2>
            </div>
            <p className="mt-2 text-sm text-gray-400 font-medium">
              {t("settings.add_api_key_desc", "Give another app access to Jellystat without a user login.")}
            </p>
          </div>
        </div>
      </DialogTitle>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
            {t("settings.api_key_name", "Name")}
          </label>
          <input
            type="text"
            value={name}
            maxLength={100}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            placeholder={t("settings.placeholder_api_key_name", "e.g. Homepage dashboard")}
            className={inputClass(!!fieldErrors.name)}
          />
          {fieldErrors.name && (
            <p className="text-[11px] font-bold text-brand-rose ml-1 flex items-center mt-1">
              <AlertCircle size={10} className="mr-1" />
              {fieldErrors.name}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
            {t("settings.api_key_access", "Access")}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              {
                value: Permissions.CanView,
                icon: Eye,
                title: t("settings.api_key_read_only", "Read only"),
                desc: t("settings.api_key_read_only_desc", "View statistics for one server."),
              },
              {
                value: Permissions.Administrator,
                icon: ShieldCheck,
                title: t("settings.api_key_admin", "Full admin"),
                desc: t("settings.api_key_admin_desc", "Everything an administrator can do."),
              },
            ].map((opt) => {
              const Icon = opt.icon;
              const active = permission === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={active}
                  disabled={loading}
                  onClick={() => setPermission(opt.value)}
                  className={`text-left p-3.5 rounded-xl border transition-all ${
                    active
                      ? "border-brand-cyan bg-brand-cyan/10"
                      : "border-border bg-background hover:border-gray-500"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm text-gray-100">
                    <Icon size={16} className={active ? "text-brand-cyan" : "text-gray-500"} />
                    {opt.title}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{opt.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {isReadOnly && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
              {t("settings.api_key_server", "Server")}
            </label>
            <select
              value={serverId}
              onChange={(e) => setServerId(e.target.value)}
              disabled={loading}
              className={inputClass(!!fieldErrors.serverId)}
            >
              {servers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {fieldErrors.serverId && (
              <p className="text-[11px] font-bold text-brand-rose ml-1 flex items-center mt-1">
                <AlertCircle size={10} className="mr-1" />
                {fieldErrors.serverId}
              </p>
            )}
          </div>
        )}

        {!isReadOnly && (
          <div className="p-3.5 rounded-xl bg-brand-amber/10 border border-brand-amber/30 flex items-start gap-3">
            <TriangleAlert size={16} className="text-brand-amber shrink-0 mt-0.5" />
            <p className="text-xs text-brand-amber font-medium leading-relaxed">
              {t(
                "settings.api_key_admin_warning",
                "A full admin key can change settings and delete data on every server. Only use it for apps you fully trust.",
              )}
            </p>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-brand-rose/10 border border-brand-rose/20 flex items-start gap-3">
            <AlertCircle size={16} className="text-brand-rose shrink-0 mt-0.5" />
            <p className="text-xs text-brand-rose/90 font-medium leading-relaxed">{error}</p>
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="px-5 py-2.5 rounded-xl bg-brand-cyan text-black font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-brand-cyan/20 active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin mr-2" />
                {t("settings.creating_api_key", "Creating")}
              </>
            ) : (
              t("settings.create_api_key", "Create")
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-background border border-border text-gray-200 hover:text-white hover:border-gray-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("common.cancel", "Cancel")}
          </button>
        </div>
      </form>
    </DialogPanel>
  );
}
