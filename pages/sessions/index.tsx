import Head from "next/head";
import { useTranslation } from "react-i18next";
import { PlaySquare } from "lucide-react";
import Sessions from "@/components/Sessions/Sessions";
import { PageHeader } from "@/components/ui";

export default function SessionsPage() {
  const { t } = useTranslation("common");

  return (
    <>
      <Head>
        <title>{t("nav.live_sessions", "Live Sessions")} | Jellystat</title>
      </Head>

      <div className="space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12">
        {/* Header */}
        <PageHeader
          iconTone="accent"
          icon={<PlaySquare size={28} />}
          title={t("nav.live_sessions", "Live Sessions")}
          description={t("live_sessions.live_sessions_desc", "Monitor real-time server playback and user streams.")}
        />

        <Sessions />
      </div>
    </>
  );
}
