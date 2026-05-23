import ItemTypes from "./enums/ItemTypes";
import LibraryTypes from "./enums/LibraryTypes";
import type { Activity } from "./activity";
import { BaseStats } from "./baseStats";

export interface TypeCountModel {
  type?: ItemTypes;
  count?: number | null;
}

export interface LibrariesWithStats extends BaseStats {
  id: string;
  serverId: string;
  name: string;
  type: LibraryTypes;
  playbackDuration?: number | null;
  size?: number | null;
  typeCounts?: TypeCountModel[];
  imageTag?: string | null;
  imageHash?: string | null;
  archived?: boolean;
}
