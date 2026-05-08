import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { ColorSchemeToggle } from "../components/ColorSchemeToggle/ColorSchemeToggle";
import { Welcome } from "../components/Welcome/Welcome";
import RecentlyAdded from "@/components/RecentlyAdded/RecentlyAdded";

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return true;
    // base64url -> base64
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = decodeURIComponent(
      atob(payload)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    const obj = JSON.parse(decoded) as { exp?: number };
    if (!obj.exp) return false;
    const now = Date.now() / 1000;
    return now >= obj.exp;
  } catch {
    return true;
  }
}

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const token = localStorage.getItem("jellystat_token");
      if (!token || isTokenExpired(token)) {
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
