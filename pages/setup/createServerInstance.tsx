import React, { useState } from "react";
import { 
  Server as ServerIcon, 
  Link as LinkIcon, 
  Globe, 
  Key, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Loader2, 
  Database
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "next-i18next/pages";

import client from "@/lib/api";
import { AddServer } from "@/lib/models/addServer";
import { Server } from "@/lib/models/server";
import ServerType from "@/lib/models/enums/serverTypes";

type Props = { onComplete?: (result?: { server?: Server }) => void };

export default function CreateServerPage({ onComplete }: Props) {
  const { t } = useTranslation("common");

  // --- STATE ---
  const [url, setUrl] = useState("");
  const [externalUrl, setExternalUrl] = useState<string>("");
  const [apiKey, setApiKey] = useState("");
  const [type, setType] = useState<ServerType>(ServerType.Jellyfin);
  const [showApiKey, setShowApiKey] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ url?: string; apiKey?: string }>({});

  // --- HANDLERS ---
  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    
    setError(null);
    setFieldErrors({});
    
    let hasError = false;
    const newFieldErrors: { url?: string; apiKey?: string } = {};

    if (!url.trim()) {
      newFieldErrors.url = t("setup.error_url_required", "Local URL is required");
      hasError = true;
    }

    if (!apiKey.trim()) {
      newFieldErrors.apiKey = t("setup.error_api_key_required", "API key is required");
      hasError = true;
    }

    if (hasError) {
      setFieldErrors(newFieldErrors);
      return;
    }

    setLoading(true);
    try {
      const serverPayload: AddServer = { 
        url: url.trim(), 
        externalURL: externalUrl.trim() || undefined, 
        apiKey: apiKey.trim(), 
        type: type 
      };
      
      const server = await client.Api.addServer(serverPayload);
      toast.success(t("setup.toast_server_connected", "Server connected successfully!"));
      onComplete?.({ server });
    } catch (err: any) {
      const errMsg = err?.message ?? t("setup.error_server_add_failed", "Unable to add server. Check your URL and API Key.");
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto animate-in zoom-in-95 fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-brand-cyan to-brand-purple rounded-2xl flex items-center justify-center shadow-lg shadow-brand-purple/20 mb-6 border border-white/10">
          <Database className="text-white" size={32} />
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight mb-2">
          {t("setup.connect_server_title", "Connect Server")}
        </h2>
        <p className="text-sm text-gray-400 font-medium">
          {t("setup.connect_server_desc", "Link your Jellyfin or Emby instance to begin tracking telemetry.")}
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-surface/60 backdrop-blur-xl border border-border rounded-3xl shadow-2xl shadow-black/40 p-6 md:p-8 relative overflow-hidden">
        
        {/* Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-cyan/10 blur-[80px] pointer-events-none rounded-full"></div>

        <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
          
          {/* Server Type Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
              {t("setup.label_platform", "Platform")}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-500 group-focus-within:text-brand-cyan transition-colors">
                <ServerIcon size={18} />
              </div>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ServerType)}
                className="w-full bg-background border border-border hover:border-gray-500 rounded-xl py-3 pl-11 pr-10 text-sm font-bold text-gray-200 focus:outline-none focus:ring-1 focus:border-brand-cyan focus:ring-brand-cyan appearance-none transition-all cursor-pointer shadow-inner"
                disabled={loading}
              >
                {Object.values(ServerType).map((t) => (
                  <option key={t} value={t} className="bg-background text-gray-100">{t}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-500">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
              </div>
            </div>
          </div>

          {/* Internal URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
              {t("setup.label_local_url", "Local URL")}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-500 group-focus-within:text-brand-cyan transition-colors">
                <LinkIcon size={18} />
              </div>
              <input
                type="text"
                placeholder={t("setup.placeholder_local_url", "http://localhost:8096")}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
                className={`w-full bg-background border rounded-xl py-3 pl-11 pr-4 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 transition-all shadow-inner ${
                  fieldErrors.url ? "border-brand-rose focus:border-brand-rose focus:ring-brand-rose/50" : "border-border hover:border-gray-500 focus:border-brand-cyan focus:ring-brand-cyan"
                }`}
              />
            </div>
            {fieldErrors.url && <p className="text-[11px] font-bold text-brand-rose ml-1 flex items-center mt-1"><AlertCircle size={10} className="mr-1" /> {fieldErrors.url}</p>}
          </div>

          {/* External URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 flex items-center justify-between">
              <span>{t("setup.label_external_url", "External URL")}</span>
              <span className="text-gray-600 font-medium tracking-normal normal-case">
                {t("setup.label_optional", "Optional")}
              </span>
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-500 group-focus-within:text-brand-cyan transition-colors">
                <Globe size={18} />
              </div>
              <input
                type="text"
                placeholder={t("setup.placeholder_external_url", "https://media.yourdomain.com")}
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                disabled={loading}
                className="w-full bg-background border border-border hover:border-gray-500 rounded-xl py-3 pl-11 pr-4 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:border-brand-cyan focus:ring-brand-cyan transition-all shadow-inner"
              />
            </div>
          </div>

          {/* API Key */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
              {t("setup.label_api_key", "API Key")}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-500 group-focus-within:text-brand-purple transition-colors">
                <Key size={18} />
              </div>
              <input
                type={showApiKey ? "text" : "password"}
                placeholder={t("setup.placeholder_api_key", "Enter server API key")}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={loading}
                className={`w-full bg-background border rounded-xl py-3 pl-11 pr-12 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 transition-all shadow-inner ${
                  fieldErrors.apiKey ? "border-brand-rose focus:border-brand-rose focus:ring-brand-rose/50" : "border-border hover:border-gray-500 focus:border-brand-purple focus:ring-brand-purple"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-500 hover:text-gray-300 transition-colors focus:outline-none"
              >
                {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.apiKey && <p className="text-[11px] font-bold text-brand-rose ml-1 flex items-center mt-1"><AlertCircle size={10} className="mr-1" /> {fieldErrors.apiKey}</p>}
          </div>

          {/* Global Error Banner */}
          {error && (
            <div className="p-3.5 rounded-xl bg-brand-rose/10 border border-brand-rose/20 flex items-start gap-3 mt-4">
              <AlertCircle size={16} className="text-brand-rose shrink-0 mt-0.5" />
              <p className="text-xs text-brand-rose/90 font-medium leading-relaxed">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || !url.trim() || !apiKey.trim()}
              className="w-full bg-brand-cyan hover:bg-brand-cyan/90 text-black font-black py-3.5 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-brand-cyan/20 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin mr-2" />
                  {t("setup.btn_connecting", "Connecting...")}
                </>
              ) : (
                t("setup.btn_add_server", "Add Server")
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}