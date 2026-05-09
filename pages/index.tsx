import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { ColorSchemeToggle } from "../components/ColorSchemeToggle/ColorSchemeToggle";
import { Welcome } from "../components/Welcome/Welcome";
import RecentlyAdded from "@/components/RecentlyAdded/RecentlyAdded";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const token = localStorage.getItem("jellystat_token");
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
    <>
      <Welcome />
      <ColorSchemeToggle />
      <RecentlyAdded />
    </>
  );
}
