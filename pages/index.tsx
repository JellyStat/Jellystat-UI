import Head from 'next/head';
import { useTranslation } from 'next-i18next/pages';
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations';
import WatchStatCards from "@/components/WatchStatCards/WatchStatCards";
import Sessions from "@/components/Sessions/Sessions";
import RecentlyAdded from "@/components/RecentlyAdded/RecentlyAdded";
import LibraryOverview from "@/components/LibraryOverview/LibraryOverview";

export default function HomePage() {
  const { t } = useTranslation("common");

  return (
    <>
      <Head>
        <title>{t("nav.overview", "Overview")} | Jellystat</title>
      </Head>
      
      <div className="flex flex-col gap-8 animate-in fade-in duration-700 pb-12">
        <section>
          <WatchStatCards />
        </section>
        <section>
          <Sessions />
        </section>
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 flex flex-col">
            <RecentlyAdded />
          </div>
          <div className="xl:col-span-1 flex flex-col">
            <LibraryOverview />
          </div>
        </section>
      </div>
    </>
  );
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale || "en", ['common'])),
    },
  };
}