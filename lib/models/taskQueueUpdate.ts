import { TaskSettings } from "./taskSettings.ts";

export interface TaskQueueUpdate {
  enqueuedTasks: TaskSettings[];
  currentTask: TaskSettings | null;
}
