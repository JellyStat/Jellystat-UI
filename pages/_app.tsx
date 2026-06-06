import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/charts/styles.css";
import "mantine-datatable/styles.layer.css";
import "@/styles/globals.css";
import "@/types/global-extensions";
import { MantineProvider, Center, Loader, Text, Card, Button, Group, Code, Flex } from "@mantine/core";
import type { AppProps } from "next/app";
import Head from "next/head";
import { theme } from "@/theme";
import SideNav from "@/components/SideNav/SideNav";
import { useEffect, useState } from "react";
import { wsClient } from "@/lib/wsClient";
import client from "@/lib/api";
import SystemState from "@/lib/models/enums/systemState";
import { useRouter } from "next/router";
import { Notifications } from "@mantine/notifications";

export default function App({ Component, pageProps }: AppProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const router = useRouter();
  const currentPath = router.asPath;

  // Fetch & init logic extracted so we can retry from UI
  const fetchSystem = async (isRetry = false) => {
    if (isRetry) {
      setRetrying(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const info = await client.System.getSystemInfo();
      if (info && info.state !== SystemState.Configured) {
        try {
          router.push("/setup");
          setLoading(false);
          return;
        } catch {
          if (typeof window !== "undefined") window.location.href = "/setup";
          setLoading(false);
          return;
        }
      }

      // system ok -> initialize ws client (if token present)
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("jellystat_token") : null;
        if (token) wsClient.init();
      } catch {
        /* ignore localStorage/ws init errors */
      }

      if (isRetry) setRetrying(false);
      else setLoading(false);
    } catch (err: any) {
      let msg = err?.message ?? String(err ?? "Unknown error");
      // if (err instanceof client.ApiError) {
      //   msg = `${err.message} (${err.status} ${err.statusText})`;
      //   if (err.raw) msg += `\n\n${err.raw}`;
      // }
      setError(msg);
      if (isRetry) setRetrying(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSystem();
  }, [router.asPath]);

  const showNav = !currentPath.startsWith("/login") && !currentPath.startsWith("/setup");
  const showLoading = loading || retrying;
  const showError = error;

  return (
    <MantineProvider theme={theme}>
      <Notifications />
      <Head>
        <title>Jellystat</title>
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no" />
        <link rel="shortcut icon" href="/favicon.svg" />
      </Head>
      <Flex direction={{ base: "column", md: "row" }} style={{ minHeight: "100vh" }}>
        {showNav && <SideNav />}
        <main style={{ flex: 1, padding: 10, minWidth: 0 }}>
          {showLoading && (
            <Center style={{ height: "100%" }}>
              <Loader />
            </Center>
          )}
          {showError && (
            <Center style={{ height: "100%", flexDirection: "column" }}>
              <Card shadow="sm" padding="lg" style={{ maxWidth: 800 }}>
                <Center style={{ flexDirection: "column", marginBottom: 5 }}>
                  <Text color="red" size="xl" style={{ marginBottom: 8, fontWeight: 700 }}>
                    Unable to connect to server
                  </Text>
                  <Text size="sm" color="dimmed">
                    The application was unable to start due to an error contacting the API. You can retry below.
                  </Text>
                </Center>
                <Center style={{ flexDirection: "column", marginBottom: 5 }}>
                  <pre style={{ whiteSpace: "pre-wrap", maxHeight: 300, overflow: "auto", marginBottom: 12 }}>{error}</pre>
                  <Group>
                    <Button onClick={() => void fetchSystem(true)} color="red" loading={retrying} disabled={retrying}>
                      {retrying ? "Retrying..." : "Retry"}
                    </Button>
                  </Group>
                </Center>
              </Card>
            </Center>
          )}
          {!showLoading && !showError && <Component {...pageProps} />}
        </main>
      </Flex>
    </MantineProvider>
  );
}
