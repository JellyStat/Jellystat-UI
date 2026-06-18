import { useEffect, useState } from "react";
import { useTranslation } from "next-i18next/pages";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";
import { Sun, Moon, Monitor, FlaskConical, LogOut } from "lucide-react";

export function ColorSchemeToggle() {
  const { t } = useTranslation("common");
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  // --- THEME LOGIC ---
  useEffect(() => {
    const storedTheme = localStorage.getItem("jellystat_theme") as "light" | "dark" | "system" | null;
    if (storedTheme) {
      setTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.add(systemPrefersDark ? "dark" : "light");
      localStorage.removeItem("jellystat_theme");
    } else {
      root.classList.add(theme);
      localStorage.setItem("jellystat_theme", theme);
    }
  }, [theme]);

  // --- ACTIONS ---
  function test() {
    const query = new GridifyQueryBuilder()
      .setPage(2)
      .setPageSize(10)
      .addOrderBy("name", true)
      .startGroup()
      .addCondition("age", op.LessThan, 50)
      .or()
      .addCondition("name", op.StartsWith, "A")
      .endGroup()
      .and()
      .addCondition("isActive", op.Equal, true)
      .build();

    console.log("Gridify Test Query:", query);
  }

  function Logout() {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem("jellystat_token");
      localStorage.removeItem("jellystat_refreshToken");
      localStorage.removeItem("jellystat_serverId"); // Clean slate for login screen
    } catch {
      /* ignore */
    }
    window.location.href = "/login";
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 mt-8 animate-in fade-in duration-500">
      
      {/* Theme Controls */}
      <button
        onClick={() => setTheme("light")}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all shadow-inner focus:outline-none focus:ring-2 focus:ring-brand-cyan group ${
          theme === "light" 
            ? "bg-brand-cyan/20 border-brand-cyan text-brand-cyan" 
            : "bg-surface/50 border-border hover:bg-brand-cyan/10 hover:border-brand-cyan/50 text-gray-400 hover:text-brand-cyan"
        } border`}
        title={t("theme.light", "Light Mode")}
      >
        <Sun size={18} className="group-hover:scale-110 transition-transform" />
        <span className="text-sm font-bold tracking-wide">{t("theme.light", "Light Mode")}</span>
      </button>

      <button
        onClick={() => setTheme("dark")}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all shadow-inner focus:outline-none focus:ring-2 focus:ring-brand-purple group ${
          theme === "dark" 
            ? "bg-brand-purple/20 border-brand-purple text-brand-purple" 
            : "bg-surface/50 border-border hover:bg-brand-purple/10 hover:border-brand-purple/50 text-gray-400 hover:text-brand-purple"
        } border`}
        title={t("theme.dark", "Dark Mode")}
      >
        <Moon size={18} className="group-hover:scale-110 transition-transform" />
        <span className="text-sm font-bold tracking-wide">{t("theme.dark", "Dark Mode")}</span>
      </button>

      <button
        onClick={() => setTheme("system")}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500 group ${
          theme === "system" 
            ? "bg-emerald-500/20 border-emerald-500 text-emerald-500" 
            : "bg-surface/50 border-border hover:bg-emerald-500/10 hover:border-emerald-500/50 text-gray-400 hover:text-emerald-500"
        } border`}
        title={t("theme.auto", "System Auto")}
      >
        <Monitor size={18} className="group-hover:scale-110 transition-transform" />
        <span className="text-sm font-bold tracking-wide">{t("theme.auto", "System Auto")}</span>
      </button>

      {/* Divider */}
      <div className="w-px h-8 bg-border mx-1 hidden sm:block"></div>

      {/* Admin / Action Controls */}
      <button
        onClick={test}
        className="flex items-center gap-2 px-4 py-2.5 bg-surface/50 hover:bg-amber-500/10 border border-border hover:border-amber-500/50 text-gray-400 hover:text-amber-500 rounded-xl transition-all shadow-inner group focus:outline-none focus:ring-2 focus:ring-amber-500"
      >
        <FlaskConical size={18} className="group-hover:scale-110 transition-transform" />
        <span className="text-sm font-bold tracking-wide">{t("admin.test", "Test")}</span>
      </button>

      <button
        onClick={Logout}
        className="flex items-center gap-2 px-4 py-2.5 bg-surface/50 hover:bg-brand-rose/10 border border-border hover:border-brand-rose/50 text-gray-400 hover:text-brand-rose rounded-xl transition-all shadow-inner group focus:outline-none focus:ring-2 focus:ring-brand-rose"
      >
        <LogOut size={18} className="group-hover:scale-110 transition-transform" />
        <span className="text-sm font-bold tracking-wide">{t("auth.logout", "Logout")}</span>
      </button>

    </div>
  );
}