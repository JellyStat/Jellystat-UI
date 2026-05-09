import { ItemTypes } from "./enums/ItemTypes";
import { MediaStreamType } from "./enums/MediaStreamType";
import type { BaseMediaStream } from "./baseMediaStream";

export interface Items {
  id: string;
  serverId: string;
  name: string;
  libraryId: string;
  dateCreated?: string | null;
  mediaStreams?: BaseMediaStream[];
  duration?: number;
  type?: ItemTypes;
  imageTag?: string;
  imageHash?: string;
  genres?: string[];
  path?: string | null;
  size?: number;
  bitrate?: number;
  parentId?: string | null;
  parentIndex?: number | null;
  index?: number | null;
  archived?: boolean;
}
