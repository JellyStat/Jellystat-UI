import Activity from "./activity.ts";

export interface BaseStats {
  playCount?: number | null;
  playDuration?: number | null;
  latestActivity?: Activity | null;
  latestActivityDate?: Date | null;
}
