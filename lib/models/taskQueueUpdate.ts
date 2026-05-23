import { TaskSettings } from "./taskSettings";

export interface TaskQueueUpdate {
  enqueuedTasks: TaskSettings[];
  currentTask: TaskSettings | null;
}
