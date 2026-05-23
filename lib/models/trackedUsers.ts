import { BaseStats } from "./baseStats.ts";
import { Items } from "./items.ts";

export interface TrackedUsers extends BaseStats {
  tracked: boolean;
  id: string;
  username: string;
  serverId: string;
  imageTag?: string | null;
  item?: Items | null;
}
