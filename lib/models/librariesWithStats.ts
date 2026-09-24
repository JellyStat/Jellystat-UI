import ItemTypes from "./enums/ItemTypes";
import LibraryTypes from "./enums/LibraryTypes";
import type { Activity } from "./activity";
import { Libraries } from "./libraries";
import { BaseStatsWithActivity } from "./baseStatsWithActivity";

export interface TypeCountModel {
  type?: ItemTypes;
  count?: number | null;
}

export interface LibrariesWithStats extends Libraries, BaseStatsWithActivity {
  playbackDuration?: number | null;
  size?: number | null;
  typeCounts?: TypeCountModel[];
  hasArchivedItems?: boolean | null;
}
