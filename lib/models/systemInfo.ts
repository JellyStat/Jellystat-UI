import SystemState from "./enums/systemState";

export interface SystemInfo {
  state: SystemState;
  version: string;
}
