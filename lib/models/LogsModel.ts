import { Tasks } from "./enums/Tasks";

export interface LogsModel {
  id: string;
  serverId: string;
  task: Tasks;
  dateCreated: string;
  duration: number;
  messages: string[];
  success: boolean | null;
}
