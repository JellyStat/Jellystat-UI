import type { Items } from "./items";
import type { Activity } from "./activity";
import ItemsWithParentData from "./itemsWithParentData";

export interface ItemsWithStats extends ItemsWithParentData {
  playCount?: number | null;
  playDuration?: number | null;
  latestActivity?: Activity | null;
}
