import type { TFunction } from "i18next";
import WebhookEvents from "@/lib/models/enums/WebhookEvents";
import type { WebhookEventInfo } from "@/lib/models/webhooks";

type EventText = { label: string; description: string };

// Static t() calls so `npm run extract` picks every key up
const translated = (t: TFunction): Record<WebhookEvents, EventText> => ({
  [WebhookEvents.PlaybackStarted]: {
    label: t("webhook_events.playback_started", "Playback started"),
    description: t("webhook_events.playback_started_desc", "When a user starts a playback."),
  },
  [WebhookEvents.PlaybackEnded]: {
    label: t("webhook_events.playback_ended", "Playback ended"),
    description: t("webhook_events.playback_ended_desc", "When a user stops a playback."),
  },
  [WebhookEvents.PlaybackBelowThreshold]: {
    label: t("webhook_events.playback_below_threshold", "Playback below threshold"),
    description: t(
      "webhook_events.playback_below_threshold_desc",
      "When a playback ends before the minimum watch time so it isn't recorded as activity.",
    ),
  },
  [WebhookEvents.MediaAdded]: {
    label: t("webhook_events.media_added", "Media added"),
    description: t("webhook_events.media_added_desc", "When a sync finds new item."),
  },
  [WebhookEvents.SyncCompleted]: {
    label: t("webhook_events.sync_completed", "Full sync completed"),
    description: t(
      "webhook_events.sync_completed_desc",
      "When a full sync finishes, with the libraries synced and how many items were added, updated and archived.",
    ),
  },
});

/** The translated label and description for an event; events the UI doesn't know yet use the server's text. */
export function webhookEventText(t: TFunction, key: string, info?: WebhookEventInfo): EventText {
  return translated(t)[key as WebhookEvents] ?? { label: info?.label ?? key, description: info?.description ?? "" };
}
