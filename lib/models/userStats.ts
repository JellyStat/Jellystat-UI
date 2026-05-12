import Activity from "./activity";
import { Users } from "./users";

export interface UserStats extends Users {
  playCount?: number | null;
  playDuration?: number | null;
  latestActivity?: Activity | null;
}
