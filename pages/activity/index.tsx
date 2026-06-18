import React from "react";
import Head from "next/head";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";

import { ActivityTable } from "@/components/ActivityTable/ActivityTable";

export default function ActivityPage() {
  const { t } = useTranslation("common");

  return (
    <>
      <Head>
        <title>{t("activity.title", "Activity Log")} | Jellystat</title>
      </Head>
      
      <div className="w-full h-full animate-in fade-in duration-500">
        <ActivityTable />
      </div>
    </>
  );
}

// Ensure translations are loaded server-side for this specific page
export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale || "en", ["common"])),
    },
  };
}