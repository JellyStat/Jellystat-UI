export interface TrackedLibraries {
  tracked: boolean;
  id: string;
  serverId: string;
  name: string;
  type: string;
  imageTag?: string | null;
  imageHash?: string | null;
  archived?: boolean;
}
