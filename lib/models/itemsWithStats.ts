import ItemsWithParentData from "./itemsWithParentData";
import { BaseStats } from "./baseStats.ts";

export interface ItemsWithStats extends ItemsWithParentData, BaseStats {}
