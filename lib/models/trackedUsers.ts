import { BaseStats } from "./baseStats";
import { Items } from "./items";

export interface TrackedUsers extends BaseStats {
  tracked: boolean;
  id: string;
  username: string;
  serverId: string;
  imageTag?: string | null;
  item?: Items | null;
}
