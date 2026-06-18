import "@/styles/globals.css";
import "@/types/global-extensions";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { wsClient } from "@/lib/wsClient";
import client from "@/lib/api";
import SystemState from "@/lib/models/enums/systemState";
import SideNav from "@/components/SideNav/SideNav";
import { Loader2, AlertTriangle } from "lucide-react";
import { Toaster } from "sonner";

import { appWithTranslation, useTranslation } from 'next-i18next/pages';

function App({ Component, pageProps }: AppProps) {
  const { t } = useTranslation("common");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const router = useRouter();
  const currentPath = router.asPath;

  const fetchSystem = async (isRetry = false) => {
    if (isRetry) setRetrying(true);
    else setLoading(true);
    
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

      // Initialize WebSocket
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
      setError(msg);
      if (isRetry) setRetrying(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSystem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.asPath]);

  const hideNav = currentPath.includes("/login") || currentPath.includes("/setup");
  const showLoading = loading || retrying;
  const showError = error;

  return (
    <>
      <Head>
        <title>Jellystat</title>
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no" />
        <link rel="shortcut icon" href="/favicon.svg" />
      </Head>

      <Toaster theme="dark" richColors position="top-right" />

      <div className="flex h-screen w-screen bg-background font-sans text-gray-200 selection:bg-brand-purple/30 overflow-hidden">
        
        {/* Render Sidebar unless on Auth/Setup pages */}
        {!hideNav && <SideNav />}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col relative min-w-0 bg-background overflow-hidden">
          
          {/* Ambient Background Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-brand-purple/5 blur-[120px] pointer-events-none rounded-full z-0"></div>

          <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 w-full">
            
            {/* Loading State */}
            {showLoading && (
              <div className="h-full w-full flex flex-col items-center justify-center animate-in fade-in duration-500">
                <Loader2 size={48} className="text-brand-purple animate-spin mb-4" />
                <p className="text-gray-400 font-medium tracking-wide">
                  {t("app.connecting", "Connecting to Jellystat...")}
                </p>
              </div>
            )}
            
            {/* Error State */}
            {showError && (
              <div className="h-full w-full flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="bg-surface border border-brand-rose/20 p-8 md:p-10 rounded-3xl shadow-2xl shadow-brand-rose/10 max-w-2xl w-full text-center relative overflow-hidden">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-brand-rose/10 blur-[80px] pointer-events-none rounded-full z-0"></div>
                  
                  <div className="relative z-10">
                    <div className="mx-auto w-16 h-16 bg-brand-rose/10 text-brand-rose rounded-full flex items-center justify-center mb-6 border border-brand-rose/20 shadow-inner">
                      <AlertTriangle size={32} />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tight">
                      {t("app.connection_failed", "Connection Failed")}
                    </h2>
                    <p className="text-gray-400 text-sm mb-8">
                      {t("app.connection_failed_desc", "The application was unable to start due to an error contacting the API. Please ensure your backend is running.")}
                    </p>
                    
                    <div className="bg-background border border-border rounded-xl p-5 mb-8 text-left overflow-auto max-h-64 shadow-inner">
                      <pre className="text-xs font-mono text-brand-rose/90 whitespace-pre-wrap break-words">{error}</pre>
                    </div>
                    
                    <button 
                      onClick={() => void fetchSystem(true)} 
                      disabled={retrying}
                      className="bg-brand-rose hover:bg-rose-600 text-white font-bold py-3 px-8 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center mx-auto shadow-lg shadow-brand-rose/20 cursor-pointer active:scale-95"
                    >
                      {retrying ? <Loader2 size={18} className="animate-spin mr-2" /> : null}
                      {retrying ? t("app.retrying", "Retrying...") : t("app.retry_connection", "Retry Connection")}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Component Injection */}
            {!showLoading && !showError && (
              <div className={hideNav ? "w-full h-full" : "p-6 md:p-10 max-w-[1600px] mx-auto w-full"}>
                <Component {...pageProps} />
              </div>
            )}
            
          </div>
        </main>
      </div>
    </>
  );
}

export default appWithTranslation(App);