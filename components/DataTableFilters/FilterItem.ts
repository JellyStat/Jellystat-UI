export type DatesRangeValue = [Date | null, Date | null];
export type NumberRangeValue = {
  min: number | null;
  max: number | null;
};

export default class FilterItem {
  key: string;
  value: string | number | boolean | Date | DatesRangeValue | NumberRangeValue | null;

  constructor(key: string, value: string | number | boolean | Date | DatesRangeValue | NumberRangeValue | null) {
    this.key = key;
    this.value = value;
  }
}
