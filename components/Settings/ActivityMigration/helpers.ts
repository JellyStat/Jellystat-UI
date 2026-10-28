import Activity from "@/lib/models/activity";
import ItemTypes from "@/lib/models/enums/ItemTypes";
import { Items } from "@/lib/models/items";

export type MigrationGroup =
  | { kind: "series"; key: string; seriesName: string; children: Activity[] }
  | { kind: "movie"; key: string; activity: Activity };

/**
 * Groups a page of unlinked activity into series (with their episodes) and movies,
 * keeping the order in which each group first appears.
 */
export function groupActivity(data: Activity[]): MigrationGroup[] {
  const groups: MigrationGroup[] = [];
  const seriesByKey = new Map<string, Extract<MigrationGroup, { kind: "series" }>>();

  for (const activity of data) {
    const isEpisode = activity.seriesId != null || !!activity.seriesName;
    if (!isEpisode) {
      groups.push({ kind: "movie", key: activity.id ?? activity.itemId ?? "", activity });
      continue;
    }

    const key = `series:${activity.seriesId ?? activity.seriesName}`;
    let group = seriesByKey.get(key);
    if (!group) {
      group = { kind: "series", key, seriesName: activity.seriesName ?? "", children: [] };
      seriesByKey.set(key, group);
      groups.push(group);
    }
    group.children.push(activity);
  }

  return groups;
}

/** "S01E06" for an episode with season and episode numbers, otherwise null. */
export function episodeCode(item: Pick<Items, "type" | "parentIndex" | "index"> | null | undefined): string | null {
  if (!item || item.type !== ItemTypes.Episode || item.parentIndex == null || item.index == null) return null;
  return `S${String(item.parentIndex).padStart(2, "0")}E${String(item.index).padStart(2, "0")}`;
}
