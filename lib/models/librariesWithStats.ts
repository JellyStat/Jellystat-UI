import ItemTypes from "./enums/ItemTypes";
import LibraryTypes from "./enums/LibraryTypes";
import type { Activity } from "./activity";

export interface TypeCountModel {
  type?: ItemTypes;
  count?: number | null;
}

export interface LibrariesWithStats {
  id: string;
  serverId: string;
  name: string;
  type: LibraryTypes;
  playCount?: number | null;
  playDuration?: number | null;
  playbackDuration?: number | null;
  size?: number | null;
  latestActivity?: Activity | null;
  typeCounts?: TypeCountModel[];
  imageTag?: string | null;
  imageHash?: string | null;
  archived?: boolean;
}
