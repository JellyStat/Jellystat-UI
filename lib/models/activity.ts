import type { BaseMediaStream } from "./baseMediaStream";
import { Items } from "./items";

export interface BaseTranscodingInfo {
  videoCodec?: string | null;
  audioCodec?: string | null;
  container?: string | null;
  isVideoDirect?: boolean;
  isAudioDirect?: boolean;
  bitrate?: number;
  completionPercentage?: number;
  width?: number;
  height?: number;
  transcodeReasons?: string[];
}

export interface Activity {
  id?: string;
  serverId?: string;
  name?: string;
  seriesName?: string | null;
  userId?: string;
  userName?: string;
  client?: string | null;
  device?: string | null;
  deviceId?: string | null;
  itemId?: string;
  seriesId?: string | null;
  seasonId?: string | null;
  duration?: number;
  directPlay?: boolean;
  playMethod?: string;
  mediaStreams?: BaseMediaStream[];
  transcodingInfo?: BaseTranscodingInfo | null;
  imported?: boolean;
  dateCreated?: string;
  container?: string | null;
  ipAddress?: string;
  runtimeTicks?: number;
  completionPercentage?: number;
  libraryId?: string;
  item?: Items | null;
  groupedResults?: Activity[] | null;
  playCount?: number;
  playDuration?: number;
}

export default Activity;
