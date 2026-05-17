import type { BaseMediaStream } from "./baseMediaStream";
import { ItemTypes } from "./enums/ItemTypes";

export interface BaseNowPlayingItem {
  id?: string;
  name?: string;
  container?: string | null;
  genres?: string[];
  isHD?: boolean | null;
  isFolder?: boolean | null;
  parentId?: string | null;
  mediaStreams?: BaseMediaStream[];
  imageTag?: string | null;
  imageHash?: string | null;
  locationType?: string | null;
  mediaType?: string | null;
  width?: number | null;
  height?: number | null;
  type?: ItemTypes;
  providers?: string[];
  seriesName?: string | null;
  seriesId?: string | null;
  seasonId?: string | null;
  runtimeTicks?: number | null | undefined;
  parentIndexNumber?: number | null;
  indexNumber?: number | null;
}

export default BaseNowPlayingItem;
