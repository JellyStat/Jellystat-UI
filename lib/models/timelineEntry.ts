export interface TimelineEntry {
  serverId: string;
  title: string;
  /** Series id for episodes, item id otherwise (used for the poster and the link). */
  itemId: string;
  libraryId: string;
  libraryType: string;
  isSeries: boolean;
  firstSeason?: number | null;
  lastSeason?: number | null;
  episodeCount: number;
  firstActivityDate: string;
  lastActivityDate: string;
  /** Total playback in seconds. */
  totalPlayDuration: number;
  imageHash?: string | null;
}

export default TimelineEntry;
