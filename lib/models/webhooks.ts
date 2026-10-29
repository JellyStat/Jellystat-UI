export type WebhookEventKey = "playback.started" | "playback.ended" | "media.added" | "sync.completed";
export type EventWebhookType = "generic" | "discord";

export interface EventWebhook {
  /** Omit to create a new webhook. */
  id?: string;
  name: string;
  url: string;
  type: EventWebhookType;
  events: WebhookEventKey[];
  /** Only events from this server; null for every server. */
  serverId?: string | null;
  enabled: boolean;
  headers?: Record<string, string> | null;
  /** Custom JSON body with {{tokens}}; null sends the standard payload. */
  payloadTemplate?: string | null;
  /** Write only: null keeps the saved secret, "" removes it. */
  secret?: string | null;
  hasSecret?: boolean;
  createdAt?: string | null;
  lastTriggeredAt?: string | null;
  lastEvent?: string | null;
  lastSuccess?: boolean | null;
  lastError?: string | null;
}

export interface WebhookEventInfo {
  key: WebhookEventKey;
  label: string;
  description: string;
  /** The standard payload with sample values; template tokens are paths into it. */
  sample: unknown;
}

export interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number | null;
  error?: string | null;
  elapsedMs: number;
}
