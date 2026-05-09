import type { Items } from "./items";
import type { Activity } from "./activity";

export interface ItemsWithStats extends Items {
  playCount?: number | null;
  playDuration?: number | null;
  latestActivity?: Activity | null;
}
