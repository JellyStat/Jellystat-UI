import type { BaseMediaStream } from "./baseMediaStream";
import { BaseStats } from "./baseStats";
import { BaseTranscodingInfo } from "./baseTranscodingInfo";
import { Items } from "./items";

export interface Activity extends BaseStats {
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
}

export default Activity;
