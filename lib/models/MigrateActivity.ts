export class MigrateActivity {
  id: string;
  ServerId: string;
  SeriesId: string;
  SeasonId: string;
  ItemId: string;
  success: boolean;
  errorMessage?: string | null;
  itemName?: string | null;

  constructor(data: Partial<MigrateActivity> = {}) {
    this.id = data.id ?? "";
    this.ServerId = data.ServerId ?? "";
    this.SeriesId = data.SeriesId ?? "";
    this.SeasonId = data.SeasonId ?? "";
    this.ItemId = data.ItemId ?? "";
    this.success = Boolean(data.success ?? true);
    this.errorMessage = data.errorMessage ?? null;
  }

  /** Create a model instance from a response-like object. Accepts flexible casing. */
  static fromJSON(input: any): MigrateActivity {
    const obj = input ?? {};
    return new MigrateActivity({
      id: String(obj.id ?? obj.Id ?? ""),
      ServerId: String(obj.ServerId ?? obj.serverId ?? ""),
      SeriesId: String(obj.SeriesId ?? obj.seriesId ?? ""),
      SeasonId: String(obj.SeasonId ?? obj.seasonId ?? ""),
      ItemId: String(obj.ItemId ?? obj.itemId ?? ""),
      success: Boolean(obj.success ?? obj.Success ?? false),
      errorMessage: obj.errorMessage ?? obj.ErrorMessage ?? null,
    });
  }

  /** Create model instances from an array response. */
  static fromJSONArray(input: any): MigrateActivity[] {
    if (!Array.isArray(input)) return [];
    return input.map((item) => MigrateActivity.fromJSON(item));
  }

  /**
   * Return a new `MigrateActivity` with selective overrides.
   * Example: `const next = current.copyWith({ success: true })`
   */
  copyWith(overrides: Partial<MigrateActivity> = {}): MigrateActivity {
    const data = { ...(this.toJSON() as Record<string, any>), ...overrides } as Partial<MigrateActivity>;
    return new MigrateActivity(data);
  }

  /** Return a plain object suitable for JSON serialization / API requests. */
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      ServerId: this.ServerId,
      SeriesId: this.SeriesId,
      SeasonId: this.SeasonId,
      ItemId: this.ItemId,
      success: this.success,
      errorMessage: this.errorMessage ?? null,
    };
  }
}
