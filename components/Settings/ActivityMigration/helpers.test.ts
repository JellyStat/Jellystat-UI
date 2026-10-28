import ItemTypes from "@/lib/models/enums/ItemTypes";
import { ActivityMigrationModel } from "@/lib/models/ActivityMigrationModel";
import type Activity from "@/lib/models/activity";
import type ItemsWithParentData from "@/lib/models/itemsWithParentData";
import { episodeCode, groupActivity } from "./helpers";

const item = (id: string, type: ItemTypes, extra: Partial<ItemsWithParentData> = {}) =>
  ({ id, serverId: "s", name: id, libraryId: "l", type, archived: false, ...extra }) as ItemsWithParentData;

describe("groupActivity", () => {
  it("groups episodes under their series and keeps movies separate, in first-seen order", () => {
    const data: Activity[] = [
      { id: "1", name: "Ep A", seriesName: "Severance", seriesId: "old-sev" },
      { id: "2", name: "Dune" },
      { id: "3", name: "Ep B", seriesName: "Severance", seriesId: "old-sev" },
      { id: "4", name: "Ep C", seriesName: "The Bear", seriesId: "old-bear" },
    ];

    const groups = groupActivity(data);

    expect(groups.map((g) => g.kind)).toEqual(["series", "movie", "series"]);
    const first = groups[0];
    expect(first.kind === "series" && first.children.map((c) => c.id)).toEqual(["1", "3"]);
    expect(groups[1].kind === "movie" && groups[1].activity.id).toBe("2");
  });

  it("returns an empty list for no data", () => {
    expect(groupActivity([])).toEqual([]);
  });
});

describe("episodeCode", () => {
  it("formats season and episode numbers", () => {
    expect(episodeCode(item("e", ItemTypes.Episode, { parentIndex: 1, index: 6 }))).toBe("S01E06");
  });

  it("returns null when it is not a numbered episode", () => {
    expect(episodeCode(item("m", ItemTypes.Movie))).toBeNull();
    expect(episodeCode(item("e", ItemTypes.Episode, { parentIndex: null, index: 3 }))).toBeNull();
    expect(episodeCode(null)).toBeNull();
  });
});

describe("ActivityMigrationModel.status", () => {
  const episode: Activity = { id: "1", name: "Ep", seriesId: "old", seriesName: "Show" };
  const movie: Activity = { id: "2", name: "Film" };

  it("is waiting for an episode without a series", () => {
    expect(new ActivityMigrationModel({ activity: episode }).status).toBe("waiting");
  });

  it("is notLinked until an item is chosen", () => {
    expect(new ActivityMigrationModel({ activity: movie }).status).toBe("notLinked");
    expect(
      new ActivityMigrationModel({ activity: episode, seriesItem: item("s", ItemTypes.Series) }).status
    ).toBe("notLinked");
  });

  it("is ready once everything is chosen", () => {
    expect(new ActivityMigrationModel({ activity: movie, item: item("m", ItemTypes.Movie) }).status).toBe(
      "ready"
    );
  });

  it("is failed when an error is recorded, and copyWith can clear it", () => {
    const failed = new ActivityMigrationModel({
      activity: movie,
      item: item("m", ItemTypes.Movie),
      errorMessage: "boom",
    });
    expect(failed.status).toBe("failed");
    expect(failed.copyWith({ errorMessage: null }).status).toBe("ready");
  });

  it("copyWith keeps fields that are not passed", () => {
    const m = new ActivityMigrationModel({ activity: movie, item: item("m", ItemTypes.Movie) });
    expect(m.copyWith({}).item?.id).toBe("m");
    expect(m.copyWith({ item: null }).item).toBeNull();
  });
});
