import type { Items } from "./items";

export interface ItemsWithParentData extends Items {
  parent?: Items | null;
}

export default ItemsWithParentData;
