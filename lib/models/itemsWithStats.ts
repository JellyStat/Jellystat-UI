import type { Items } from "./items";

export interface ItemsWithStats extends Items {
  playCount?: number | null;
  playDuration?: number | null;
  lastPlayedDate?: string | null;
  lastPlayedName?: string | null;
}
