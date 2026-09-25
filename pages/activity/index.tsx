import React from "react";
import Head from "next/head";
import { useTranslation } from "react-i18next";

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
