import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { useEffect, useState } from "react";
import { Activity, Film, Users, BarChart3, History, Settings, PlaySquare, LogOut, Server as ServerIcon } from "lucide-react";

import permissionsManager from "@/lib/permissionsManager";
import Permissions from "@/lib/models/enums/Permissions";
import configManager from "@/lib/configManager";
import { Server } from "@/lib/models/server";
import { wsClient } from "@/lib/wsClient";
import StatusIndicator from "../Core/StatusIndicator";

export default function SideNav() {
  const router = useRouter();
  const currentPath = router.pathname;
  const { t } = useTranslation("common");

  // --- REAL-TIME STATE ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [serverOptions, setServerOptions] = useState<{ value: string; label: string }[]>([]);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    try {
      const adminCheck = permissionsManager.hasPermission(Permissions.Administrator);
      setIsAdmin(adminCheck);

      if (adminCheck) {
        configManager
          .getConfig()
          .then((list: Server[]) => {
            const opts = list.map((s) => ({ value: s.id, label: `${s.type} - ${s.name}` }));
            setServerOptions(opts);
          })
          .catch((err) => console.error("Failed to load server options", err));
      }

      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("jellystat_serverId");
        if (stored) setSelectedServer(stored);
      }
    } catch (err) {
      setIsAdmin(false);
    }

    setIsConnected(wsClient.isConnected());

    const handleOpen = () => setIsConnected(true);
    const handleClose = () => setIsConnected(false);

    wsClient.on("open", handleOpen);
    wsClient.on("close", handleClose);
    wsClient.on("error", handleClose);

    return () => {
      wsClient.off("open", handleOpen);
      wsClient.off("close", handleClose);
      wsClient.off("error", handleClose);
    };
  }, []);

  // --- HANDLERS ---
  const handleServerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newServerId = e.target.value;
    try {
      if (newServerId) {
        localStorage.setItem("jellystat_serverId", newServerId);
        setSelectedServer(newServerId);
        wsClient.close();

        window.location.href = "/";
      }
    } catch (err) {
      console.warn("Failed to store selected server");
    }
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      localStorage.removeItem("jellystat_token");
      localStorage.removeItem("jellystat_refreshToken");
      localStorage.removeItem("jellystat_serverId");
      localStorage.removeItem("jellystat_config");
      router.push("/login");
    } catch {
      console.warn("Failed to clear localStorage during logout, proceeding to login.");
      router.push("/login");
    }
  };

  // --- NAVIGATION ROUTES ---
  const navItems = [
    { name: t("nav.overview", "Overview"), path: "/", icon: Activity },
    { name: t("nav.live_sessions", "Live Sessions"), path: "/sessions", icon: PlaySquare },
    { name: t("nav.libraries", "Libraries"), path: "/libraries", icon: Film },
    { name: t("nav.activity", "Activity"), path: "/activity", icon: History },
    { name: t("nav.statistics", "Statistics"), path: "/statistics", icon: BarChart3 },
  ];

  const adminItems = [
    { name: t("nav.users", "Users"), path: "/users", icon: Users },
    { name: t("nav.settings", "Settings"), path: "/settings", icon: Settings },
  ];

  const activeItems = [...navItems, ...(isAdmin ? adminItems : [])];

  return (
    <aside className="w-64 bg-surface border-r border-border flex flex-col z-20 shrink-0 shadow-2xl shadow-black/50 transition-all duration-300">
      {/* Brand Header */}
      <div className="h-20 flex items-center px-6 border-b border-border bg-background/50 shrink-0">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-brand-cyan to-brand-purple shadow-lg shadow-brand-purple/20 mr-3">
          <Activity className="text-white" size={24} />
        </div>
        <span className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-400">
          Jellystat
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        {activeItems.map((item) => {
          const isActive = currentPath === item.path || (item.path !== "/" && currentPath.startsWith(item.path));
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 font-medium group ${
                isActive
                  ? "bg-brand-purple/10 text-brand-purple shadow-inner border border-brand-purple/20"
                  : "text-gray-400 hover:text-gray-100 hover:bg-surface-hover border border-transparent"
              }`}
            >
              <Icon
                size={20}
                className={`transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-110 opacity-70 group-hover:opacity-100"}`}
              />
              <span className="ml-3 tracking-wide">{item.name}</span>
            </Link>
          );
        })}

        {/* Logout Button */}
        <div className="pt-4 mt-4 border-t border-border/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 font-medium text-gray-400 hover:text-brand-rose hover:bg-brand-rose/10 group cursor-pointer"
          >
            <LogOut size={20} className="opacity-70 group-hover:opacity-100 transition-opacity" />
            <span className="ml-3 tracking-wide">{t("nav.logout", "Logout")}</span>
          </button>
        </div>
      </nav>

      {/* Footer: Live Status & Server Switcher */}
      <div className="p-5 border-t border-border bg-background/30 flex flex-col shrink-0 gap-4">
        {/* Dynamic Status Indicator */}
        <div className="flex items-center gap-3">
          <StatusIndicator color={isConnected ? "bg-brand-emerald" : "bg-brand-rose"} />
          <div className="flex flex-col text-left">
            <span className="text-sm font-bold text-gray-200">
              {isConnected ? t("status.online", "System Online") : t("status.offline", "System Offline")}
            </span>
            <span className={`text-[11px] font-mono tracking-wider ${isConnected ? "text-gray-500" : "text-brand-rose/80"}`}>
              {isConnected ? t("status.connected", "WS CONNECTED") : t("status.disconnected", "DISCONNECTED")}
            </span>
          </div>
        </div>

        {/* Admin Server Switcher */}
        {isAdmin && serverOptions.length > 0 && (
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 group-focus-within:text-brand-cyan transition-colors">
              <ServerIcon size={14} />
            </div>
            <select
              value={selectedServer || ""}
              onChange={handleServerChange}
              className="w-full bg-surface/50 border border-border hover:border-gray-600 rounded-lg py-2 pl-9 pr-8 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:border-brand-cyan focus:ring-brand-cyan appearance-none transition-all cursor-pointer"
            >
              <option value="" disabled className="bg-background text-gray-500">
                {t("nav.select_server", "Select a server...")}
              </option>
              {serverOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-background text-gray-100">
                  {opt.label}
                </option>
              ))}
            </select>
            {/* Custom Select Chevron */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
              <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                <path
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                  fillRule="evenodd"
                ></path>
              </svg>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
