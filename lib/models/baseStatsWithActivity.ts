import Activity from "./activity";
import { BaseStats } from "./baseStats";

export interface BaseStatsWithActivity extends BaseStats {
  latestActivity?: Activity | null;
  latestActivityDate?: Date | null;
}
