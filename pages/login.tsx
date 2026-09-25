import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { useTranslation } from "react-i18next";
import { Activity, Lock, User, Server as ServerIcon, ChevronRight, Loader2, AlertCircle } from "lucide-react";

import client from "@/lib/api";
import { wsClient } from "@/lib/wsClient";
import permissionsManager from "@/lib/permissionsManager";
import { setToken } from "@/lib/helpers/tokenHelper";
import { Server } from "@/lib/models/server";
import DropdownSelector from "@/components/Core/DropdownSelector";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation("common");

  // --- STATE ---
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showServerPicker, setShowServerPicker] = useState(false);
  const [serverOptions, setServerOptions] = useState<{ value: string; label: string }[]>([]);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingServers, setLoadingServers] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [serverValidationError, setServerValidationError] = useState<string | null>(null);

  // --- AUTO-REDIRECT ---
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const token = localStorage.getItem("jellystat_token");
      if (token) {
        router.replace("/");
      }
    } catch {
      /* ignore */
    }
  }, [router]);

  // --- SERVER FETCH LOGIC ---
  const fetchServers = async () => {
    setLoadingServers(true);
    setServerError(null);
    try {
      const config: Server[] = await client.Auth.getConfig();

      const servers = Array.isArray(config) ? config : [];

      setServerOptions(
        servers
          .filter((s) => s.allowRemoteAuth == true)
          .map((s: any) => ({
            value: s.Id || s.id,
            label: s.Name || s.name,
          })),
      );
    } catch (err: any) {
      setServerError(t("login.error_fetch_servers", "Failed to load servers. Please check your connection."));
    } finally {
      setLoadingServers(false);
    }
  };

  const toggleServerPicker = () => {
    const nextState = !showServerPicker;
    setShowServerPicker(nextState);
    setError(null);
    if (nextState && serverOptions.length === 0) {
      fetchServers();
    }
  };

  // --- SUBMIT LOGIC ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUsernameError(null);
    setPasswordError(null);
    setServerValidationError(null);

    let hasError = false;
    if (!username.trim()) {
      setUsernameError(t("common.error_username_required", "Username is required"));
      hasError = true;
    }
    if (!password.trim()) {
      setPasswordError(t("common.error_password_required", "Password is required"));
      hasError = true;
    }
    if (showServerPicker && !selectedServer) {
      setServerValidationError(t("login.error_server_required", "Please select a server"));
      hasError = true;
    }
    if (hasError) return;

    setLoading(true);

    try {
      const activeServerId = showServerPicker && selectedServer ? selectedServer : undefined;

      const payload = {
        username,
        password,
        serverId: activeServerId,
      };

      const res = await client.Auth.login(payload);
      await setToken(res, activeServerId);

      // Force permissions manager to read from the newly set JWT token
      permissionsManager.clearCache();

      try {
        wsClient.init();
      } catch (wsErr) {
        console.warn("WebSocket init failed during login:", wsErr);
      }

      router.push("/");
    } catch (err: any) {
      setError(err?.message || t("login.error_auth_failed", "Failed to authenticate. Please check your credentials."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{t("login.page_title", "Login")} | Jellystat</title>
      </Head>

      <div className="min-h-screen w-full bg-background flex items-center justify-center relative overflow-hidden font-sans selection:bg-brand-cyan/30">
        {/* Ambient Background Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-cyan/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-purple/10 blur-[120px] rounded-full pointer-events-none"></div>

        {/* Login Card */}
        <div className="w-full max-w-md p-8 sm:p-10 bg-surface/80 backdrop-blur-2xl border border-border rounded-3xl shadow-2xl shadow-black/60 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out m-4">
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-cyan to-brand-purple p-[1px] shadow-lg shadow-brand-cyan/20 mb-6">
              <div className="w-full h-full bg-surface rounded-[15px] flex items-center justify-center">
                <Activity
                  size={32}
                  className="text-transparent bg-clip-text bg-gradient-to-br from-brand-cyan to-brand-purple"
                  style={{ stroke: "url(#gradient)" }}
                />
                <svg width="0" height="0">
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop stopColor="var(--color-brand-cyan)" offset="0%" />
                    <stop stopColor="var(--color-brand-purple)" offset="100%" />
                  </linearGradient>
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-2">{t("login.welcome_back", "Welcome Back")}</h1>
            <p className="text-sm text-gray-400 font-medium">
              {showServerPicker
                ? t("login.subtitle_server", "Authenticate via Jellyfin Server")
                : t("login.subtitle_local", "Sign in to your local account")}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Global Error Banner */}
            {(error || serverError) && (
              <div className="p-4 rounded-xl bg-brand-rose/10 border border-brand-rose/20 flex items-start gap-3 animate-in fade-in zoom-in-95">
                <AlertCircle size={18} className="text-brand-rose shrink-0 mt-0.5" />
                <p className="text-sm text-brand-rose/90 font-medium leading-relaxed">{error || serverError}</p>
              </div>
            )}

            {/* Username Input */}
            <div className="space-y-1.5">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-500 group-focus-within:text-brand-cyan transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t("login.username_placeholder", "Username")}
                  className={`w-full bg-background/50 border rounded-xl py-3.5 pl-11 pr-4 text-gray-100 placeholder:text-gray-600 focus:outline-none focus:ring-1 transition-all ${
                    usernameError
                      ? "border-brand-rose/50 focus:border-brand-rose focus:ring-brand-rose"
                      : "border-border focus:border-brand-cyan focus:ring-brand-cyan"
                  }`}
                  disabled={loading}
                />
              </div>
              {usernameError && <p className="text-xs text-brand-rose font-medium pl-1">{usernameError}</p>}
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-500 group-focus-within:text-brand-cyan transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("login.password_placeholder", "Password")}
                  className={`w-full bg-background/50 border rounded-xl py-3.5 pl-11 pr-4 text-gray-100 placeholder:text-gray-600 focus:outline-none focus:ring-1 transition-all ${
                    passwordError
                      ? "border-brand-rose/50 focus:border-brand-rose focus:ring-brand-rose"
                      : "border-border focus:border-brand-cyan focus:ring-brand-cyan"
                  }`}
                  disabled={loading}
                />
              </div>
              {passwordError && <p className="text-xs text-brand-rose font-medium pl-1">{passwordError}</p>}
            </div>

            {/* Server Picker (Conditional) */}

            {showServerPicker && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                <DropdownSelector<string | null>
                  data={serverOptions.map((opt) => ({ value: opt.value, Icon: loadingServers ? Loader2 : ServerIcon }))}
                  value={selectedServer}
                  onChange={setSelectedServer}
                  labelFn={(val) =>
                    serverOptions.find((opt) => opt.value === val)?.label ?? t("common.select_server", "Select a server...")
                  }
                  placeholder={t("common.select_server", "Select a server...")}
                  leftIcon={ServerIcon}
                  loading={loadingServers}
                />
                {serverValidationError && <p className="text-xs text-brand-rose font-medium pl-1">{serverValidationError}</p>}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !username.trim() || !password.trim() || (showServerPicker && !selectedServer)}
                className="w-full relative group overflow-hidden rounded-xl p-[1px] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-brand-cyan to-brand-purple rounded-xl opacity-80 group-hover:opacity-100 transition-opacity"></span>
                <div className="relative flex items-center justify-center bg-surface hover:bg-transparent backdrop-blur-sm px-6 py-3.5 rounded-xl transition-colors">
                  {loading ? (
                    <Loader2 size={20} className="animate-spin text-white" />
                  ) : (
                    <>
                      <span className="font-bold text-white tracking-wide">{t("login.submit_button", "Sign In")}</span>
                      <ChevronRight size={18} className="text-white ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
              </button>
            </div>
          </form>

          {/* Toggle Login Mode */}
          <div className="mt-8 text-center border-t border-border/50 pt-6">
            <button
              onClick={toggleServerPicker}
              type="button"
              className="text-sm font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              {showServerPicker
                ? t("login.switch_local", "Switch to Local Account Login")
                : t("login.switch_server", "Login via Jellyfin/Emby")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
