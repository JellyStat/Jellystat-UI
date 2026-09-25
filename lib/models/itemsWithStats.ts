import ItemsWithParentData from "./itemsWithParentData";
import { BaseStatsWithActivity } from "./baseStatsWithActivity";

export interface ItemsWithStats extends ItemsWithParentData, BaseStatsWithActivity {
  hasArchivedItems?: boolean | null;
}
