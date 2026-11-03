import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { UserPlus, Database, CheckCircle2, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

import SystemState from "@/lib/models/enums/systemState";
import client from "@/lib/api";
import { processServerId, setToken } from "@/lib/helpers/tokenHelper";

import CreateUserPage from "@/components/Setup/CreateUser";
import CreateServerPage from "@/components/Setup/CreateServerInstance";
import SetupCompletePage from "@/components/Setup/SetupComplete";
import { Spinner } from "@/components/ui";

function hasStoredToken(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return !!localStorage.getItem("jellystat_token");
  } catch {
    return false;
  }
}

export default function SetupPage() {
  const { t } = useTranslation("common");
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const order = useMemo(() => [SystemState.Unconfigured, SystemState.FirstUserCreated, SystemState.Configured], []);

  const [systemState, setSystemState] = useState<SystemState>(SystemState.Unconfigured);

  const foundIndex = order.indexOf(systemState);
  const activeIndex = foundIndex !== -1 ? foundIndex : 0;

  const fetchSystem = async (suppressLoader = false) => {
    if (!suppressLoader) setLoading(true);
    setError(null);
    try {
      const info = await client.System.getSystemInfo();
      const state = info?.state ?? SystemState.Unconfigured;

      // After the admin is created, the server step is admin-only. Without a stored login (another browser,
      // or the API restarted), send them to sign in first instead of failing on the server step.
      if (state === SystemState.FirstUserCreated && !hasStoredToken()) {
        void router.replace("/login");
        return;
      }

      setSystemState(state);
    } catch (err: any) {
      let msg = err?.message ?? String(err ?? t("errors.unknown_error", "Unknown error"));
      if (err instanceof client.ApiError) {
        msg = `${err.message} (${err.status} ${err.statusText})`;
      }
      setError(msg);
    } finally {
      if (!suppressLoader) setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSystem();
  }, []);

  // --- STATIC STEPPER CONFIG ---
  const steps = [
    {
      id: 0,
      label: t("setup.step_admin", "Administrator"),
      description: t("setup.step_admin_desc", "Create local account"),
      icon: UserPlus,
      activeClasses: "ring-primary bg-surface text-primary shadow-[0_0_15px_var(--color-primary)]",
    },
    {
      id: 1,
      label: t("setup.step_connect", "Connect"),
      description: t("setup.step_connect_desc", "Link media server"),
      icon: Database,
      activeClasses: "ring-accent bg-surface text-accent shadow-[0_0_15px_var(--color-accent)]",
    },
    {
      id: 2,
      label: t("setup.step_complete", "Complete"),
      description: t("setup.step_complete_desc", "Ready to launch"),
      icon: CheckCircle2,
      activeClasses: "ring-success bg-surface text-success shadow-[0_0_15px_var(--color-success)]",
    },
  ];

  return (
    <>
      <Head>
        <title>{t("setup.page_title", "Setup")} | Jellystat</title>
      </Head>

      <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center relative overflow-hidden font-sans selection:bg-accent/30 py-12 px-4">
        {/* Ambient Background Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full pointer-events-none"></div>

        {loading ? (
          <div className="flex flex-col items-center justify-center animate-in fade-in z-10">
            <Spinner size={48} className="text-primary mb-4" />
            <p className="text-gray-400 font-medium tracking-wide">
              {t("setup.checking_system", "Checking system configuration")}
            </p>
          </div>
        ) : error ? (
          <div className="bg-surface/80 backdrop-blur-md border border-danger/20 p-8 rounded-3xl shadow-2xl shadow-danger/10 max-w-lg w-full text-center relative z-10 animate-in zoom-in-95">
            <div className="mx-auto w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center mb-6 border border-danger/20 shadow-inner">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{t("errors.configuration_error", "Configuration Error")}</h2>
            <p className="text-gray-400 text-sm mb-6">{error}</p>
            <button
              onClick={() => void fetchSystem()}
              className="bg-danger-solid hover:bg-danger-solid-hover text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-danger/20"
            >
              {t("common.retry_connection", "Retry Connection")}
            </button>
          </div>
        ) : (
          <div className="w-full max-w-4xl relative z-10 flex flex-col items-center">
            {/* Stepper */}
            <div className="w-full max-w-2xl mb-12 px-4">
              <div className="flex items-center justify-between relative">
                {/* Connecting Lines Behind Steps */}
                <div className="absolute left-[15%] right-[15%] top-6 h-1 bg-surface-hover border-y border-border rounded-full -z-10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-700 ease-out"
                    style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
                  ></div>
                </div>

                {/* Step Indicators */}
                {steps.map((step, index) => {
                  const isCompleted = activeIndex > index;
                  const isActive = activeIndex === index;
                  const Icon = step.icon;

                  let ringColor = "ring-border bg-surface text-gray-500";
                  if (isCompleted)
                    ringColor = "ring-success bg-success text-black shadow-[0_0_15px_rgba(52,211,153,0.4)]";
                  if (isActive) ringColor = step.activeClasses;

                  return (
                    <div key={step.id} className="flex flex-col items-center relative z-10 group w-1/3">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ring-2 transition-all duration-500 ease-out mb-3 bg-surface ${ringColor}`}
                      >
                        {isCompleted ? <CheckCircle2 size={20} className="text-black" /> : <Icon size={20} />}
                      </div>
                      <div className="text-center w-full">
                        <p
                          className={`text-sm font-bold transition-colors duration-300 ${isActive ? "text-white" : isCompleted ? "text-gray-300" : "text-gray-500"}`}
                        >
                          {step.label}
                        </p>
                        <p className="text-xs uppercase tracking-wider text-gray-500 mt-0.5 hidden sm:block">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Step Content Container */}
            <div className="w-full relative transition-all duration-500 ease-in-out flex justify-center">
              {/* Global Transition Overlay */}
              {isTransitioning && (
                <div className="absolute inset-0 z-50 bg-background/50 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center animate-in fade-in">
                  <Spinner size={40} className="text-primary mb-3" />
                  <span className="text-sm font-bold text-white tracking-wide">{t("common.loading", "Loading")}</span>
                </div>
              )}

              {activeIndex === 0 && (
                <CreateUserPage
                  onComplete={async (result) => {
                    setIsTransitioning(true);
                    try {
                      const token = await client.Auth.login({
                        username: result?.username ?? "",
                        password: result?.password ?? "",
                      });
                      const tokenSet = await setToken(token);
                      if (!tokenSet) throw new Error(t("errors.login_succeeded_but_failed_to_persist", "Login succeeded but failed to persist token"));

                      setSystemState(SystemState.FirstUserCreated);

                      await fetchSystem(true);
                    } catch (err: any) {
                      setError(err.message || t("errors.authentication_failed_during_setup", "Authentication failed during setup"));
                    } finally {
                      setIsTransitioning(false);
                    }
                  }}
                />
              )}

              {activeIndex === 1 && (
                <CreateServerPage
                  onComplete={async (result) => {
                    setIsTransitioning(true);
                    try {
                      await processServerId(result?.server?.id);

                      setSystemState(SystemState.Configured);

                      await fetchSystem(true); // Let this resolve in the background
                    } catch (err: any) {
                      console.error("Failed to process server ID", err);
                      setSystemState(SystemState.Configured); // Advance anyway
                      await fetchSystem(true);
                    } finally {
                      setIsTransitioning(false);
                    }
                  }}
                />
              )}

              {activeIndex === 2 && <SetupCompletePage />}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
