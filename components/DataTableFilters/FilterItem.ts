import { DatesRangeValue } from "@mantine/dates";

export default class FilterItem {
  key: string;
  value: string | number | boolean | Date | DatesRangeValue | null;

  constructor(key: string, value: string | number | boolean | Date | DatesRangeValue | null) {
    this.key = key;
    this.value = value;
  }
}
