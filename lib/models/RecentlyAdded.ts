import type { ItemsWithParentData } from "./itemsWithParentData";
import type { Items } from "./items";

export interface RecentlyAdded extends ItemsWithParentData {
  grouped: Items[];
}
