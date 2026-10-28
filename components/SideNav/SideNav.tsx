import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import {
  Activity,
  Film,
  Users,
  BarChart3,
  History,
  Settings,
  PlaySquare,
  LogOut,
  Menu,
  X,
  Server as ServerIcon,
  FileBarChart,
} from "lucide-react";

import permissionsManager from "@/lib/permissionsManager";
import Permissions from "@/lib/models/enums/Permissions";
import configManager from "@/lib/configManager";
import { Server } from "@/lib/models/server";
import { wsClient } from "@/lib/wsClient";
import StatusIndicator from "../Core/StatusIndicator";
import DropdownSelector from "../Core/DropdownSelector";

export default function SideNav() {
  const router = useRouter();
  const currentPath = router.pathname;
  const { t } = useTranslation("common");

  // --- REAL-TIME STATE ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [serverOptions, setServerOptions] = useState<{ value: string; label: string }[]>([]);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the mobile drawer whenever the route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [router.asPath]);

  // Close the drawer with the Escape key
  useEffect(() => {
    if (!mobileOpen) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  // Reset drawer state if the viewport grows to desktop size
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setMobileOpen(false);
      }
    };
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

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

  const handleServerChange = (value: string | null) => {
    const newServerId = value;
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
    // Close the socket first: it was opened with this user's token and would otherwise stay open
    // (logout is a client-side navigation), keeping this user's live feed for whoever logs in next.
    wsClient.close();
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
    { name: t("nav.overview", "Overview"), path: "/", icon: Activity, isAdmin: false },
    { name: t("nav.live_sessions", "Live Sessions"), path: "/sessions", icon: PlaySquare, isAdmin: false },
    { name: t("nav.libraries", "Libraries"), path: "/libraries", icon: Film, isAdmin: false },
    { name: t("nav.activity", "Activity"), path: "/activity", icon: History, isAdmin: false },
    { name: t("nav.statistics", "Statistics"), path: "/statistics", icon: BarChart3, isAdmin: false },
    { name: t("nav.reports", "Reports"), path: "/reports", icon: FileBarChart, isAdmin: false },
    { name: t("nav.users", "Users"), path: "/users", icon: Users, isAdmin: true },
    { name: t("nav.settings", "Settings"), path: "/settings", icon: Settings, isAdmin: false },
  ];

  const activeItems = navItems.filter((item) => !item.isAdmin || isAdmin);

  const brand = (
    <>
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-brand-cyan to-brand-purple shadow-lg shadow-brand-purple/20 mr-3 shrink-0">
        <Activity className="text-white" size={24} />
      </div>
      <span className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-linear-to-r from-gray-100 to-gray-400">
        Jellystat
      </span>
    </>
  );

  return (
    <>
      {/* Mobile Top Bar (hidden on desktop) */}
      <header className="lg:hidden flex-none h-16 flex items-center justify-between gap-3 px-4 bg-surface/95 backdrop-blur-md border-b border-border z-30 pt-[env(safe-area-inset-top)] box-content">
        <Link href="/" className="flex items-center min-w-0">
          {brand}
        </Link>
        <div className="flex items-center gap-3">
          <span
            className="flex items-center"
            title={isConnected ? t("status.online", "System Online") : t("status.offline", "System Offline")}
          >
            <StatusIndicator color={isConnected ? "bg-brand-emerald" : "bg-brand-rose"} />
          </span>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label={t("nav.open_menu", "Open menu")}
            aria-expanded={mobileOpen}
            aria-controls="jellystat-sidenav"
            className="w-11 h-11 -mr-1.5 flex items-center justify-center rounded-xl text-gray-300 hover:text-white hover:bg-surface-hover active:scale-95 transition-all cursor-pointer"
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* Mobile Backdrop */}
      <div
        aria-hidden="true"
        onClick={() => setMobileOpen(false)}
        className={`lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        id="jellystat-sidenav"
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] lg:static lg:z-20 lg:w-64 lg:max-w-none lg:translate-x-0 h-dvh max-h-dvh bg-surface border-r border-border flex flex-col shrink-0 shadow-2xl shadow-black/50 transition-transform duration-300 ease-out lg:transition-none ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 lg:h-20 flex-none flex items-center justify-between px-6 border-b border-border bg-background/50 pt-[env(safe-area-inset-top)] box-content lg:pt-0 lg:box-border">
          <div className="flex items-center min-w-0">{brand}</div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label={t("nav.close_menu", "Close menu")}
            className="lg:hidden w-10 h-10 -mr-2 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-surface-hover cursor-pointer"
          >
            <X size={22} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 min-h-0 py-6 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
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
        <div className="p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-border bg-background/30 flex-none flex flex-col gap-4">
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
            <DropdownSelector<string | null>
              data={serverOptions.map((opt) => ({ value: opt.value, Icon: ServerIcon }))}
              value={selectedServer}
              onChange={handleServerChange}
              labelFn={(val) =>
                serverOptions.find((opt) => opt.value === val)?.label ?? t("common.select_server", "Select a server...")
              }
            />
          )}
        </div>
      </aside>
    </>
  );
}
