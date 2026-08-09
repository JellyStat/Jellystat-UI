import { useEffect, useState } from "react";
import { MonitorPlay } from "lucide-react";
import { useTranslation } from "next-i18next/pages";
import { wsClient } from "@/lib/wsClient";
import { WebsocketMessage } from "@/lib/models/WebsocketMessage";
import WebSocketMessageTypes from "@/lib/models/enums/WebSocketMessageTypes";
import SessionItem from "@/lib/models/sessionItem";
import SessionCard from "./SessionCard";
import NoData from "../ErrorCards/NoData";
import StatusIndicator from "../Core/StatusIndicator";

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
        const sorted = payload.sort((a, b) => a.userName!.localeCompare(b.userName!));
        setSessions(sorted);
      } else {
        const sorted = [payload as SessionItem, ...sessions].sort((a, b) => a.userName!.localeCompare(b.userName!));
        setSessions(sorted);
      }
    };

    wsClient.on(eventTag, handler);
    return () => wsClient.off(eventTag, handler);
  }, [eventTag]);

  return (
    <div className="flex flex-col w-full animate-in fade-in duration-500">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6">
        <StatusIndicator color={sessions.length == 0 ? "bg-brand-rose" : "bg-brand-emerald"} />
        <h2 className="text-xl font-black text-gray-200 tracking-tight flex items-center gap-2">
          {t("sessions.active_streams", "Active Streams")}
        </h2>
      </div>

      <div className="w-full">
        {sessions.length === 0 ? (
          /* Empty State */
          <NoData
            Icon={MonitorPlay}
            title={t("sessions.no_active", "No active sessions")}
            message={t("sessions.waiting", "Waiting for users to start playing media...")}
          />
        ) : (
          /* Responsive Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 3xl:grid-cols-3 gap-6">
            {sessions.map((s: SessionItem) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
