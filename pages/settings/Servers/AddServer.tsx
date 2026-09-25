import React, { useState } from "react";
import { AlertCircle, Eye, EyeOff, Loader2, Lock, User, UserPlus } from "lucide-react";
import { DialogPanel, DialogTitle } from "@headlessui/react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import client from "@/lib/api";
import ServerType from "@/lib/models/enums/serverTypes";
import { AddServer } from "@/lib/models/addServer";
import DropdownSelector from "@/components/Core/DropdownSelector";

type Props = {
  onClose: () => void;
  onCreated?: () => void;
};

export default function AddServerModal({ onClose, onCreated }: Props) {
  const { t } = useTranslation("common");

  const [Url, setUrl] = useState("");
  const [ApiKey, setApiKey] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [serverType, setServerType] = useState(ServerType.Jellyfin);
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ Url?: string; ApiKey?: string }>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError(null);
    setFieldErrors({});

    const nextFieldErrors: typeof fieldErrors = {};
    if (!Url.trim()) {
      nextFieldErrors.Url = t("common.error_url_required", "URL is required");
    }
    if (!ApiKey.trim()) {
      nextFieldErrors.ApiKey = t("common.error_api_key_required", "API Key is required");
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setLoading(true);
    try {
      const payload: AddServer = { url: Url.trim(), apiKey: ApiKey.trim(), externalURL: undefined, type: serverType };
      if (externalUrl.trim() !== "") {
        payload.externalURL = externalUrl.trim();
      }
      await client.Api.addServer(payload);
      toast.success(t("settings.toast_server_created", "Server created successfully"));
      onCreated?.();
      onClose();
    } catch (err: any) {
      const message = err?.message ?? t("settings.error_create_server", "Failed to create server");
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
                <UserPlus size={22} className="text-brand-cyan" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">{t("settings.add_server", "Add Server")}</h2>
            </div>
            <p className="mt-2 text-sm text-gray-400 font-medium">
              {t("settings.add_server_desc", "Add a new Jellyfin or Emby server to monitor.")}
            </p>
          </div>
        </div>
      </DialogTitle>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">{t("common.url", "URL")}</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-500 group-focus-within:text-brand-cyan transition-colors">
              <User size={18} />
            </div>
            <input
              type="text"
              value={Url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              placeholder={t("settings.placeholder_url", "Enter the server URL")}
              className={`w-full bg-background border rounded-xl py-3 pl-11 pr-4 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 transition-all shadow-inner ${
                fieldErrors.Url
                  ? "border-brand-rose focus:border-brand-rose focus:ring-brand-rose/50"
                  : "border-border hover:border-gray-500 focus:border-brand-cyan focus:ring-brand-cyan"
              }`}
            />
          </div>
          {fieldErrors.Url && (
            <p className="text-[11px] font-bold text-brand-rose ml-1 flex items-center mt-1">
              <AlertCircle size={10} className="mr-1" />
              {fieldErrors.Url}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
            {t("settings.label_external_url", "External URL")}
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-500 group-focus-within:text-brand-cyan transition-colors">
              <User size={18} />
            </div>
            <input
              type="text"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              disabled={loading}
              placeholder={t("settings.placeholder_url", "Enter the server URL")}
              className={`w-full bg-background border rounded-xl py-3 pl-11 pr-4 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 transition-all shadow-inner ${"border-border hover:border-gray-500 focus:border-brand-cyan focus:ring-brand-cyan"}`}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
            {t("common.api_key", "API Key")}
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-500 group-focus-within:text-brand-cyan transition-colors">
              <Lock size={18} />
            </div>
            <input
              type={showApiKey ? "text" : "password"}
              value={ApiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={loading}
              placeholder={t("settings.placeholder_api_key", "Enter your API key")}
              className={`w-full bg-background border rounded-xl py-3 pl-11 pr-12 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 transition-all shadow-inner ${
                fieldErrors.ApiKey
                  ? "border-brand-rose focus:border-brand-rose focus:ring-brand-rose/50"
                  : "border-border hover:border-gray-500 focus:border-brand-cyan focus:ring-brand-cyan"
              }`}
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
          {fieldErrors.ApiKey && (
            <p className="text-[11px] font-bold text-brand-rose ml-1 flex items-center mt-1">
              <AlertCircle size={10} className="mr-1" />
              {fieldErrors.ApiKey}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
            {t("settings.label_server_type", "Server Type")}
          </label>
          <div className="relative group">
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
        </div>

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
            disabled={loading || !Url.trim() || !ApiKey.trim()}
            className="px-5 py-2.5 rounded-xl bg-brand-cyan hover:bg-brand-cyan text-white font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-brand-cyan/20 active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin mr-2" />
                {t("settings.adding_server", "Adding Server")}
              </>
            ) : (
              t("settings.add_server", "Add Server")
            )}
          </button>
        </div>
      </form>
    </DialogPanel>
  );
}
