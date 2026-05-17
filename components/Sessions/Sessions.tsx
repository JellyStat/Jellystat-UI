import React, { useEffect, useState } from "react";
import { Title, Text, SimpleGrid, Group } from "@mantine/core";
import { wsClient } from "@/lib/wsClient";
import classes from "./Sessions.module.css";
import { WebsocketMessage } from "@/lib/models/WebsocketMessage";
import WebSocketMessageTypes from "@/lib/models/enums/WebSocketMessageTypes";
import SessionCard from "./SessionCard";
import SessionItem from "@/lib/models/sessionItem";

export function Sessions() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const eventTag = WebSocketMessageTypes.Sessions.toString();

  useEffect(() => {
    const handler = (msg: WebsocketMessage<SessionItem[]>) => {
      const payload = msg?.data;
      if (!payload) {
        console.warn("Received sessions message with no data");
        return;
      }
      if (Array.isArray(payload)) setSessions(payload);
      else setSessions((prev) => [payload, ...prev]);
    };

    // runtime subscribe (wsClient.on is narrowly typed)
    wsClient.on(eventTag, handler);
    return () => wsClient.off(eventTag, handler);
  }, []);

  return (
    <Group style={{ flexDirection: "column", alignItems: "start" }}>
      <Title order={2}>Sessions</Title>
      <div className={classes.container}>
        {sessions.length === 0 ? (
          <Text style={{ fontStyle: "italic" }}>No active sessions</Text>
        ) : (
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xs" style={{ width: "100%" }}>
            {sessions.map((s: SessionItem) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </SimpleGrid>
        )}
      </div>
    </Group>
  );
}

export default Sessions;
