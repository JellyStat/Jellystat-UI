/* Global WebSocket client singleton
   - Initializes using NEXT_PUBLIC_WS_URL or derived from API_BASE
   - Attaches token as `token` query parameter (from localStorage)
   - Exposes `init`, `send`, `close`, `on`, `off`, and `isConnected`
*/
import { API_BASE } from "./api";
import { WebsocketMessage } from "./models/WebsocketMessage";
import { notifications } from "@mantine/notifications";

type Handler = (payload: any) => void;

class WebSocketClient {
  private ws?: WebSocket | null = null;
  private reconnectDelay = 1000;
  private maxDelay = 30000;
  private shouldReconnect = true;
  private handlers: Map<string, Set<Handler>> = new Map();
  private notificationId: string | null = null;

  private buildUrl(): string {
    // Prefer explicit env var
    const explicit = typeof window !== "undefined" ? (process.env.NEXT_PUBLIC_WS_URL as string | undefined) : undefined;
    let base = explicit ?? API_BASE ?? "";
    if (!base && typeof window !== "undefined") base = window.location.origin + "/";

    // Ensure trailing slash on base so URL parsing is consistent
    if (!base.endsWith("/")) base = base + "/";

    try {
      const u = new URL(base);
      const protocol = u.protocol === "https:" ? "wss:" : "ws:";
      const host = u.host;
      // default socket path is /ws
      return `${protocol}//${host}/WebSocket`;
    } catch {
      // fallback: use origin
      if (typeof window !== "undefined") {
        const origin = window.location.origin;
        const protocol = origin.startsWith("https") ? "wss:" : "ws:";
        return `${protocol}//${window.location.host}/ws`;
      }
      return "";
    }
  }

  init(): void {
    if (typeof window === "undefined") return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;
    this.shouldReconnect = true;
    this.connect();
  }

  private connect() {
    // Build fresh url each time so token/serverId changes are picked up on reconnect
    let url = this.buildUrl();
    if (!url) return;

    try {
      const token = (() => {
        try {
          return localStorage.getItem("jellystat_token");
        } catch {
          return null;
        }
      })();

      const serverId = (() => {
        try {
          return localStorage.getItem("jellystat_serverId");
        } catch {
          return null;
        }
      })();

      const params: string[] = [];
      if (token) params.push(`token=${encodeURIComponent(token)}`);
      if (serverId) params.push(`serverId=${encodeURIComponent(serverId)}`);
      if (params.length) {
        const sep = url.includes("?") ? "&" : "?";
        url = `${url}${sep}${params.join("&")}`;
      }

      this.ws = new WebSocket(url);
    } catch (err) {
      this.emit("error", err as any);
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectDelay = 1000;
      this.emit("open", null);
      if (this.notificationId != null) {
        notifications.update({
          id: this.notificationId,
          color: "teal",
          title: "Reconnected",
          message: "Connection re-established.",
          loading: false,
          autoClose: 2000,
          allowClose: true,
        });
        this.notificationId = null;
      }
    };

    this.ws.onmessage = (ev) => {
      try {
        // ignore binary frames explicitly
        if (ev.data instanceof Blob || ev.data instanceof ArrayBuffer) return;

        let parsed: any;
        if (typeof ev.data === "string") {
          parsed = JSON.parse(ev.data);
        } else if (ev.data && typeof ev.data === "object") {
          parsed = ev.data;
        } else {
          return; // ignore other non-json frames
        }

        if (!parsed || typeof parsed !== "object") return;

        const message = parsed as WebsocketMessage;

        const emitTag: string = message.type.toString();

        // emit parsed object directly; do not normalize key casing
        this.emit(emitTag, message);
      } catch {
        // invalid JSON — ignore
      }
    };

    this.ws.onclose = (ev) => {
      this.emit("close", ev);
      if (this.shouldReconnect) this.scheduleReconnect();
    };

    this.ws.onerror = (ev) => {
      this.emit("error", ev);
    };
  }

  private scheduleReconnect() {
    setTimeout(() => {
      if (!this.shouldReconnect) return;
      if (this.notificationId == null) {
        this.notificationId = notifications.show({
          loading: true,
          title: "Reconnecting...",
          message: "Connection lost. Attempting to reconnect.",
          autoClose: false,
          allowClose: false,
        });
      }
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, this.maxDelay);
      this.connect();
    }, this.reconnectDelay);
  }

  send(data: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
    try {
      const out = typeof data === "string" ? data : JSON.stringify(data);
      this.ws.send(out);
      return true;
    } catch {
      return false;
    }
  }

  close() {
    this.shouldReconnect = false;
    try {
      this.ws?.close();
    } catch {
      /* ignore */
    }
    this.ws = null;
  }

  on(event: string, handler: Handler) {
    const set = this.handlers.get(event) ?? new Set<Handler>();
    set.add(handler);
    this.handlers.set(event, set);
  }

  off(event: string, handler?: Handler) {
    if (!handler) {
      this.handlers.delete(event);
      return;
    }
    const set = this.handlers.get(event);
    if (!set) return;
    set.delete(handler);
    if (set.size === 0) this.handlers.delete(event);
  }

  private emit(event: string, payload: any) {
    const set = this.handlers.get(event);
    console.debug(`Emitting event '${event}' to ${set?.size ?? 0} handler(s)`, payload);
    if (!set) return;
    for (const h of Array.from(set)) {
      try {
        h(payload);
      } catch {
        /* swallow handler errors */
      }
    }
  }

  isConnected(): boolean {
    return !!this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// Ensure a single global instance even if the module is imported multiple ways
const g = globalThis as any;
export const wsClient: WebSocketClient = g.__jellystat_wsClient ?? (g.__jellystat_wsClient = new WebSocketClient());

export default wsClient;
