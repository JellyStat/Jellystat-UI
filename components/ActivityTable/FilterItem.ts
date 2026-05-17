export default class FilterItem {
  key: string;
  value: string | number | boolean | Date | null;

  constructor(key: string, value: string | number | boolean | Date | null) {
    this.key = key;
    this.value = value;
  }
}
