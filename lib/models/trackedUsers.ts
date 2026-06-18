import { BaseStatsWithActivity } from "./baseStatsWithActivity";
import { Items } from "./items";

export interface TrackedUsers extends BaseStatsWithActivity {
  tracked: boolean;
  id: string;
  username: string;
  serverId: string;
  imageTag?: string | null;
  item?: Items | null;
}
