import { TaskSettings } from "./taskSettings";

export interface Server {
  id: string;
  url: string;
  externalURL?: string;
  name: string;
  type?: "Jellyfin" | "Emby";
  taskSettings?: TaskSettings[];
}
