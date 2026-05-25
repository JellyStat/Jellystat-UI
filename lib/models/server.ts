import ServerType from "./enums/serverTypes";
import { TaskSettings } from "./taskSettings";

export interface Server {
  id: string;
  url: string;
  externalURL?: string;
  name: string;
  type?: ServerType;
  taskSettings?: TaskSettings[];
}
