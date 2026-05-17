import type { BaseNowPlayingItem } from "./baseNowPlayingItem";
import { BaseTranscodingInfo } from "./baseTranscodingInfo";
import { PlayState } from "./playState";

export interface SessionItem {
  id?: string;
  serverId?: string;
  paused?: boolean;
  userId?: string;
  userName?: string;
  userImageTag?: string | null;
  client?: string | null;
  deviceId?: string | null;
  deviceName?: string | null;
  nowPlayingItem?: BaseNowPlayingItem | null;
  isPaused?: boolean;
  applicationVersion?: string | null;
  transcodingInfo?: BaseTranscodingInfo | null;
  isDirectPlay?: boolean;
  playMethod?: string | null;
  ipAddress?: string | null;
  lastPausedDate?: string | null;
  playState?: PlayState | null;
}

export default SessionItem;
