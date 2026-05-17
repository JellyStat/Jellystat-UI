import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { ColorSchemeToggle } from "@/components/ColorSchemeToggle/ColorSchemeToggle";
import { Welcome } from "@/components/Welcome/Welcome";
import RecentlyAdded from "@/components/RecentlyAdded/RecentlyAdded";
import WatchStatCards from "@/components/WatchStatCards/WatchStatCards";
import LibraryOverview from "@/components/LibraryOverview/LibraryOverview";
import { Container } from "@mantine/core";
import client from "@/lib/api";
import configManager from "@/lib/configManager";
import Sessions from "@/components/Sessions/Sessions";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const token = localStorage.getItem("jellystat_token");
      const configs = localStorage.getItem("jellystat_config");

      if (!token) {
        localStorage.removeItem("jellystat_token");
        localStorage.removeItem("jellystat_refreshToken");
        router.replace("/login");
      }
    } catch {
      try {
        localStorage.removeItem("jellystat_token");
        localStorage.removeItem("jellystat_refreshToken");
      } catch {}
      router.replace("/login");
    }
  }, [router]);

  return (
    <div style={{ gap: 10 }}>
      <Sessions />
      <RecentlyAdded />
      <WatchStatCards />
      <LibraryOverview />
    </div>
  );
}
