import Head from "next/head";
import { useTranslation } from "react-i18next";
import { PlaySquare } from "lucide-react";
import Sessions from "@/components/Sessions/Sessions";

export default function SessionsPage() {
  const { t } = useTranslation("common");

  return (
    <>
      <Head>
        <title>{t("nav.live_sessions", "Live Sessions")} | Jellystat</title>
      </Head>

      <div className="space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12">
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-border/50 pb-6">
          <div className="p-3.5 bg-brand-cyan/10 rounded-2xl border border-brand-cyan/20 shadow-inner shrink-0">
            <PlaySquare size={28} className="text-brand-cyan" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">{t("nav.live_sessions", "Live Sessions")}</h1>
            <p className="text-sm text-gray-400 mt-1 font-medium">
              {t("live_sessions.live_sessions_desc", "Monitor real-time server playback and user streams.")}
            </p>
          </div>
        </div>

        <Sessions />
      </div>
    </>
  );
}
