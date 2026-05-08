export interface TrackedUsers {
  tracked: boolean;
  id: string;
  username: string;
  serverId: string;
  imageTag?: string | null;
}
