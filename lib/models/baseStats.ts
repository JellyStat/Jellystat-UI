import Activity from "./activity";

export interface BaseStats {
  playCount?: number | null;
  playDuration?: number | null;
  latestActivity?: Activity | null;
  latestActivityDate?: Date | null;
}
