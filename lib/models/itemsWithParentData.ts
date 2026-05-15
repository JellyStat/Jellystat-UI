import type { Items } from "./items";

export interface ItemsWithParentData extends Items {
  parent?: Items | null;
  rootId?: string | null;
}

export default ItemsWithParentData;
