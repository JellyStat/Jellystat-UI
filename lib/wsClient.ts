/* Global WebSocket client singleton
   - Initializes using NEXT_PUBLIC_WS_URL or derived from API_BASE
   - Attaches token as `token` query parameter (from localStorage)
   - Exposes `init`, `send`, `close`, `on`, `off`, and `isConnected`
*/
import { API_BASE } from "./api";

type Handler = (payload: any) => void;

class WebSocketClient {
  private ws?: WebSocket | null = null;
  private reconnectDelay = 1000;
  private maxDelay = 30000;
  private shouldReconnect = true;
  private handlers: Map<string, Set<Handler>> = new Map();

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

    const token = (() => {
      try {
        return localStorage.getItem("jellystat_token");
      } catch {
        return null;
      }
    })();

    let url = this.buildUrl();
    if (!url) return;
    if (token) {
      const sep = url.includes("?") ? "&" : "?";
      url = `${url}${sep}token=${encodeURIComponent(token)}`;
    }

    this.shouldReconnect = true;
    this.connect(url);
  }

  private connect(url: string) {
    try {
      this.ws = new WebSocket(url);
    } catch (err) {
      this.emit("error", err as any);
      this.scheduleReconnect(url);
      return;
    }

    this.ws.onopen = () => {
      this.reconnectDelay = 1000;
      this.emit("open", null);
    };

    this.ws.onmessage = (ev) => {
      let payload: any = ev.data;
      try {
        payload = JSON.parse(ev.data);
      } catch {
        // keep raw data
      }
      this.emit("message", payload);
    };

    this.ws.onclose = (ev) => {
      this.emit("close", ev);
      if (this.shouldReconnect) this.scheduleReconnect(url);
    };

    this.ws.onerror = (ev) => {
      this.emit("error", ev);
    };
  }

  private scheduleReconnect(url: string) {
    setTimeout(() => {
      if (!this.shouldReconnect) return;
      // exponential backoff
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, this.maxDelay);
      this.connect(url);
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

  on(event: "open" | "message" | "close" | "error", handler: Handler) {
    const set = this.handlers.get(event) ?? new Set<Handler>();
    set.add(handler);
    this.handlers.set(event, set);
  }

  off(event: "open" | "message" | "close" | "error", handler?: Handler) {
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

export const wsClient = new WebSocketClient();

export default wsClient;
