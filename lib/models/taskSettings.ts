import Tasks from "./enums/Tasks";

export interface TaskSettings {
  task: Tasks;
  intervalMinutes: number;
  enabled: boolean;
}
