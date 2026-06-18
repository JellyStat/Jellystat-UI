import { useEffect, useState } from "react";
import { MonitorPlay } from "lucide-react";
import { useTranslation } from "next-i18next/pages";
import { wsClient } from "@/lib/wsClient";
import { WebsocketMessage } from "@/lib/models/WebsocketMessage";
import WebSocketMessageTypes from "@/lib/models/enums/WebSocketMessageTypes";
import SessionItem from "@/lib/models/sessionItem";
import SessionCard from "./SessionCard";

export default function Sessions() {
  const { t } = useTranslation("common");
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const eventTag = WebSocketMessageTypes.Sessions.toString();

  useEffect(() => {
    const handler = (msg: WebsocketMessage<SessionItem[]>) => {
      const payload = msg?.data;
      if (!payload) {
        console.warn("Received sessions message with no data");
        return;
      }

      if (Array.isArray(payload)) {
        setSessions(payload);
      } else {
        setSessions((prev) => [payload as any, ...prev]);
      }
    };

    wsClient.on(eventTag, handler);
    return () => wsClient.off(eventTag, handler);
  }, [eventTag]);

  return (
    <div className="flex flex-col w-full animate-in fade-in duration-500">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex h-3 w-3">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${sessions.length == 0 ? "bg-brand-rose" : "bg-brand-emerald"} opacity-75`}
          ></span>
          <span
            className={`relative inline-flex rounded-full h-3 w-3 ${sessions.length == 0 ? "bg-brand-rose" : "bg-brand-emerald"}`}
          ></span>
        </div>
        <h2 className="text-xl font-black text-gray-200 tracking-tight flex items-center gap-2">
          {t("sessions.active_streams", "Active Streams")}
        </h2>
      </div>

      <div className="w-full">
        {sessions.length === 0 ? (
          /* Empty State */
          <div className="w-full py-16 bg-surface/30 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-gray-500 shadow-inner">
            <MonitorPlay size={48} className="mb-4 opacity-20" />
            <span className="font-bold text-lg tracking-wide text-gray-400">{t("sessions.no_active", "No active sessions")}</span>
            <span className="text-sm mt-1">{t("sessions.waiting", "Waiting for users to start playing media...")}</span>
          </div>
        ) : (
          /* Responsive Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {sessions.map((s: SessionItem) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
