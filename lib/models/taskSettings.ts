import Tasks from "./enums/Tasks.ts";

export interface TaskSettings {
  task: Tasks;
  intervalMinutes: number;
  enabled: boolean;
}
