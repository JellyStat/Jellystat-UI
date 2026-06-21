import Head from "next/head";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { BarChart3 } from "lucide-react";
import WatchTrendsCard from "@/components/StatsCard/WatchTrendsCard";
import CodecStatsCard from "@/components/StatsCard/CodecStatsCard";
import ResolutionStatsCard from "@/components/StatsCard/ResolutionStatsCard";

export default function StatisticsPage() {
  const { t } = useTranslation("common");

  return (
    <>
      <Head>
        <title>{t("nav.statistics", "Statistics")} | Jellystat</title>
      </Head>

      <div className="space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-border/50 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-brand-purple/10 rounded-2xl border border-brand-purple/20 shadow-inner shrink-0">
              <BarChart3 size={28} className="text-brand-purple" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">{t("nav.statistics", "Statistics")}</h1>
              <p className="text-sm text-gray-400 mt-1 font-medium">
                {t("statistics.playback_trends", "31-Day global playback trends")}
              </p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {/* <div className="bg-surface/40 backdrop-blur-sm border border-border rounded-3xl shadow-xl shadow-black/20 overflow-hidden flex flex-col p-6 sm:p-8"></div> */}
        <div className="flex flex-col gap-6">
          <WatchTrendsCard />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            <CodecStatsCard />
            <ResolutionStatsCard />
          </div>
        </div>
      </div>
    </>
  );
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
