import "@mantine/core/styles.css";
import "../types/global-extensions";
import { MantineProvider } from "@mantine/core";
import type { AppProps } from "next/app";
import Head from "next/head";
import { theme } from "../theme";
import SideNav from "../components/SideNav/SideNav";
import { useEffect } from "react";
import { wsClient } from "../lib/wsClient";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Initialize global WS client when app mounts (if token present)
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("jellystat_token") : null;
      if (token) wsClient.init();
    } catch {
      // ignore localStorage issues
    }
  }, []);

  return (
    <MantineProvider theme={theme}>
      <Head>
        <title>Mantine Template</title>
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </Head>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <SideNav />
        <main style={{ flex: 1, padding: 20 }}>
          <Component {...pageProps} />
        </main>
      </div>
    </MantineProvider>
  );
}
