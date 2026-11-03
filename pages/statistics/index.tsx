import Head from "next/head";
import { useTranslation } from "react-i18next";
import { BarChart3 } from "lucide-react";
import WatchTrendsCard from "@/components/StatsCard/WatchTrendsCard";
import CodecStatsCard from "@/components/StatsCard/CodecStatsCard";
import ResolutionStatsCard from "@/components/StatsCard/ResolutionStatsCard";
import { PageHeader } from "@/components/ui";

export default function StatisticsPage() {
  const { t } = useTranslation("common");

  return (
    <>
      <Head>
        <title>{t("nav.statistics", "Statistics")} | Jellystat</title>
      </Head>

      <div className="space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12">
        <PageHeader
          icon={<BarChart3 size={28} />}
          title={t("nav.statistics", "Statistics")}
          description={t("statistics.playback_trends", "31-Day global playback trends")}
        />

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
