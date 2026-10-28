import React, { useState } from "react";
import { AlertCircle, Eye, EyeOff, Globe, Loader2, Lock, Server as ServerIcon, SquarePen } from "lucide-react";
import { DialogPanel, DialogTitle } from "@headlessui/react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import client from "@/lib/api";
import ServerType from "@/lib/models/enums/serverTypes";
import type { AddServer } from "@/lib/models/addServer";
import type { Server } from "@/lib/models/server";
import DropdownSelector from "@/components/Core/DropdownSelector";

type Props = {
  server: Server;
  onClose: () => void;
  onSaved?: () => void;
};

export default function EditServerModal({ server, onClose, onSaved }: Props) {
  const { t } = useTranslation("common");

  const [url, setUrl] = useState(server.url ?? "");
  const [externalUrl, setExternalUrl] = useState(server.externalURL ?? "");
  const [apiKey, setApiKey] = useState("");
  const [serverType, setServerType] = useState<ServerType>((server.type as ServerType) ?? ServerType.Jellyfin);
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ url?: string }>({});

  const inputClass = (invalid: boolean, rightPad = "pr-4") =>
    `w-full bg-background border rounded-xl py-3 pl-11 ${rightPad} text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 transition-all shadow-inner ${
      invalid
        ? "border-brand-rose focus:border-brand-rose focus:ring-brand-rose/50"
        : "border-border hover:border-gray-500 focus:border-brand-cyan focus:ring-brand-cyan"
    }`;
  const iconClass =
    "absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-500 group-focus-within:text-brand-cyan transition-colors";
  const labelClass = "text-xs font-bold text-gray-400 uppercase tracking-wider ml-1";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!url.trim()) {
      setFieldErrors({ url: t("common.error_url_required", "URL is required") });
      return;
    }

    setLoading(true);
    try {
      const payload: AddServer = {
        id: server.id,
        url: url.trim(),
        // an empty external URL clears it; an empty API key keeps the stored one
        externalURL: externalUrl.trim(),
        apiKey: apiKey.trim() || undefined,
        type: serverType as AddServer["type"],
      };
      await client.Api.addServer(payload);
      toast.success(t("settings.toast_server_updated", "Server updated successfully"));
      onSaved?.();
      onClose();
    } catch (err: any) {
      const message = err?.message ?? t("settings.error_update_server", "Failed to update server");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DialogPanel
      transition
      className="w-full max-w-lg rounded-2xl border border-border bg-surface p-5 md:p-6 shadow-2xl shadow-black/40 duration-100 ease-out data-closed:transform-[scale(95%)] data-closed:opacity-0"
    >
      <DialogTitle className="text-lg font-black text-white">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20">
                <SquarePen size={22} className="text-brand-cyan" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                {t("settings.edit_server", "Edit Server")}
              </h2>
            </div>
            <p className="mt-2 text-sm text-gray-400 font-medium">
              {t("settings.edit_server_desc", "Update how Jellystat connects to {{name}}.", { name: server.name })}
            </p>
          </div>
        </div>
      </DialogTitle>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className={labelClass}>{t("settings.label_server_name", "Name")}</label>
          <div className="relative group">
            <div className={iconClass}>
              <ServerIcon size={18} />
            </div>
            <input
              type="text"
              value={server.name}
              readOnly
              disabled
              className={`${inputClass(false)} opacity-60 cursor-not-allowed`}
            />
          </div>
          <p className="text-[11px] text-gray-500 ml-1">
            {t("settings.server_name_note", "The name comes from the server itself and is updated automatically.")}
          </p>
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>{t("common.url", "URL")}</label>
          <div className="relative group">
            <div className={iconClass}>
              <Globe size={18} />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              placeholder={t("settings.placeholder_url", "Enter the server URL")}
              className={inputClass(!!fieldErrors.url)}
            />
          </div>
          {fieldErrors.url && (
            <p className="text-[11px] font-bold text-brand-rose ml-1 flex items-center mt-1">
              <AlertCircle size={10} className="mr-1" />
              {fieldErrors.url}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>{t("settings.label_external_url", "External URL")}</label>
          <div className="relative group">
            <div className={iconClass}>
              <Globe size={18} />
            </div>
            <input
              type="text"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              disabled={loading}
              placeholder={t("settings.placeholder_external_url", "Optional. Leave empty to remove")}
              className={inputClass(false)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>{t("common.api_key", "API Key")}</label>
          <div className="relative group">
            <div className={iconClass}>
              <Lock size={18} />
            </div>
            <input
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={loading}
              autoComplete="off"
              placeholder={t("settings.placeholder_api_key_keep", "Leave blank to keep the current key")}
              className={inputClass(false, "pr-12")}
            />
            <button
              type="button"
              onClick={() => setShowApiKey((current) => !current)}
              tabIndex={-1}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-500 hover:text-gray-300 transition-colors focus:outline-none"
            >
              {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>{t("settings.label_server_type", "Server Type")}</label>
          <DropdownSelector
            data={[{ value: ServerType.Jellyfin }, { value: ServerType.Emby }]}
            value={serverType}
            onChange={(val) => setServerType(val as ServerType)}
            labelFn={(val) => {
              if (val === ServerType.Jellyfin) return "Jellyfin";
              if (val === ServerType.Emby) return "Emby";
              return "";
            }}
            disabled={loading}
          />
        </div>

        <p className="text-[11px] text-gray-500 ml-1">
          {t(
            "settings.edit_server_verify_note",
            "The connection is tested when you save. Your sync schedules and remote authentication setting are kept.",
          )}
        </p>

        {error && (
          <div className="p-3.5 rounded-xl bg-brand-rose/10 border border-brand-rose/20 flex items-start gap-3">
            <AlertCircle size={16} className="text-brand-rose shrink-0 mt-0.5" />
            <p className="text-xs text-brand-rose/90 font-medium leading-relaxed">{error}</p>
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-background border border-border text-gray-200 hover:text-white hover:border-gray-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("common.cancel", "Cancel")}
          </button>
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="px-5 py-2.5 rounded-xl bg-brand-cyan text-black font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-brand-cyan/20 active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin mr-2" />
                {t("settings.saving_server", "Saving")}
              </>
            ) : (
              t("common.save", "Save")
            )}
          </button>
        </div>
      </form>
    </DialogPanel>
  );
}
