import Activity from "./activity";
import ItemsWithParentData from "./itemsWithParentData";
import { MigrateActivity } from "./MigrateActivity";

export class ActivityMigrationModel {
  activity: Activity;
  seriesItem: ItemsWithParentData | null;
  item: ItemsWithParentData | null;

  constructor({
    activity,
    seriesItem,
    item,
  }: {
    activity: Activity;
    seriesItem?: ItemsWithParentData | null;
    item?: ItemsWithParentData | null;
  }) {
    this.activity = activity;
    this.seriesItem = seriesItem ?? null;
    this.item = item ?? null;
  }

  copyWith({
    activity,
    seriesItem,
    item,
  }: {
    activity?: Activity;
    seriesItem?: ItemsWithParentData | null;
    item?: ItemsWithParentData | null;
  }): ActivityMigrationModel {
    return new ActivityMigrationModel({
      activity: activity ?? this.activity,
      seriesItem: seriesItem ?? this.seriesItem,
      item: item ?? this.item,
    });
  }

  toMigrateActivity() {
    const isSeries = this.activity.seriesId != null;
    return new MigrateActivity({
      id: this.activity.id,
      ServerId: this.activity.serverId,
      SeriesId: this.seriesItem?.id ?? this.item?.parent?.id ?? this.activity.seriesId ?? "",
      SeasonId: this.item?.parentId ?? this.activity.seasonId ?? "",
      ItemId: this.item?.id ?? this.activity.itemId ?? "",
    });
  }

  isValid(): boolean {
    const isSeries = this.activity.seriesId != null;

    if (isSeries) {
      return this.seriesItem != null && this.item != null;
    }

    return this.item != null;
  }
}
