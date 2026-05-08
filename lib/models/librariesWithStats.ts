export interface TypeCountModel {
  type?: string;
  count?: number | null;
}

export interface LibrariesWithStats {
  id: string;
  serverId: string;
  name: string;
  type: string;
  playCount?: number | null;
  playDuration?: number | null;
  playbackDuration?: number | null;
  size?: number | null;
  lastPlayedDate?: string | null;
  lastPlayedName?: string | null;
  typeCounts?: TypeCountModel[];
  imageTag?: string | null;
  imageHash?: string | null;
  archived?: boolean;
}
