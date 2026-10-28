import Activity from "./activity";
import ItemsWithParentData from "./itemsWithParentData";
import { MigrateActivity } from "./MigrateActivity";

/**
 * - `ready`: everything needed to migrate is chosen
 * - `notLinked`: no item chosen yet
 * - `waiting`: an episode whose series hasn't been chosen yet
 * - `failed`: the last apply returned an error for this activity
 */
export type MigrationStatus = "ready" | "notLinked" | "waiting" | "failed";

export class ActivityMigrationModel {
  activity: Activity;
  seriesItem: ItemsWithParentData | null;
  item: ItemsWithParentData | null;
  errorMessage: string | null;

  constructor({
    activity,
    seriesItem,
    item,
    errorMessage,
  }: {
    activity: Activity;
    seriesItem?: ItemsWithParentData | null;
    item?: ItemsWithParentData | null;
    errorMessage?: string | null;
  }) {
    this.activity = activity;
    this.seriesItem = seriesItem ?? null;
    this.item = item ?? null;
    this.errorMessage = errorMessage ?? null;
  }

  /**
   * Returns a copy with the given fields replaced. Passing `null` clears a field;
   * leaving a field `undefined` keeps the current value.
   */
  copyWith({
    activity,
    seriesItem,
    item,
    errorMessage,
  }: {
    activity?: Activity;
    seriesItem?: ItemsWithParentData | null;
    item?: ItemsWithParentData | null;
    errorMessage?: string | null;
  }): ActivityMigrationModel {
    return new ActivityMigrationModel({
      activity: activity ?? this.activity,
      seriesItem: seriesItem !== undefined ? seriesItem : this.seriesItem,
      item: item !== undefined ? item : this.item,
      errorMessage: errorMessage !== undefined ? errorMessage : this.errorMessage,
    });
  }

  get isEpisode(): boolean {
    return this.activity.seriesId != null;
  }

  get status(): MigrationStatus {
    if (this.errorMessage) return "failed";
    if (this.isEpisode && this.seriesItem == null) return "waiting";
    if (this.item == null) return "notLinked";
    return "ready";
  }

  toMigrateActivity() {
    return new MigrateActivity({
      id: this.activity.id,
      ServerId: this.activity.serverId,
      SeriesId: this.seriesItem?.id ?? this.item?.parent?.id ?? this.activity.seriesId ?? "",
      SeasonId: this.item?.parentId ?? this.activity.seasonId ?? "",
      ItemId: this.item?.id ?? this.activity.itemId ?? "",
    });
  }

  isValid(): boolean {
    if (this.isEpisode) {
      return this.seriesItem != null && this.item != null;
    }

    return this.item != null;
  }
}
