import Activity from "./activity";

export interface MostUsedClients {
  clientName: string;
  playCount?: number | null;
  playDuration?: number | null;
  latestActivity?: Activity | null;
}
