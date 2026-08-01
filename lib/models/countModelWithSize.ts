import { CountModel } from "./countModel";

export interface CountModelWithSize extends CountModel {
  size?: number | null;
}
