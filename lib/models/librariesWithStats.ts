import ItemTypes from "./enums/ItemTypes";
import LibraryTypes from "./enums/LibraryTypes";
import type { Activity } from "./activity";
import { BaseStats } from "./baseStats";
import { Libraries } from "./libraries";

export interface TypeCountModel {
  type?: ItemTypes;
  count?: number | null;
}

export interface LibrariesWithStats extends Libraries, BaseStats {
  playbackDuration?: number | null;
  size?: number | null;
  typeCounts?: TypeCountModel[];
}
