import type { BaseMediaStream } from "./baseMediaStream";

export interface TranscodingInfo {
  audioCodec?: string | null;
  videoCodec?: string | null;
  container?: string | null;
  isVideoDirect?: boolean;
  isAudioDirect?: boolean;
  bitrate?: number;
  completionPercentage?: number;
  width?: number;
  height?: number;
  audioChannels?: number;
  hardwareAccelerationType?: string | null;
  transcodeReasons?: string[];
}

export interface ActivityV1 {
  id: string;
  isPaused?: boolean;
  userId: string;
  userName: string;
  client?: string;
  deviceName?: string;
  deviceId?: string;
  applicationVersion?: string;
  nowPlayingItemId?: string;
  nowPlayingItemName?: string;
  seasonId?: string | null;
  seriesName?: string | null;
  episodeId?: string | null;
  playbackDuration?: number | null;
  activityDateInserted?: string | null;
  playMethod?: string | null;
  mediaStreams?: BaseMediaStream[] | null;
  transcodingInfo?: TranscodingInfo | null;
  originalContainer?: string | null;
  remoteEndPoint?: string | null;
  serverId?: string | null;
  imported?: boolean;
}
