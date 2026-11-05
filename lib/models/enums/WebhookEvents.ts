export enum WebhookEvents {
  PlaybackStarted = "playback.started",
  PlaybackEnded = "playback.ended",
  PlaybackBelowThreshold = "playback.below_threshold",
  MediaAdded = "media.added",
  SyncCompleted = "sync.completed",
}

export default WebhookEvents;
