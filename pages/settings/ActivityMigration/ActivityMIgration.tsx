import { Badge, Button, Card, Container, FloatingIndicator, Group, Select, Tabs, Text, Title } from "@mantine/core";
import { useCallback, useEffect, useState } from "react";
import classes from "@/components/ActivityTable/ActivityTable.module.css";
import { DataTable } from "mantine-datatable";
import Activity from "@/lib/models/activity.ts";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";
import client from "@/lib/api.ts";
import { MigrateActivity } from "@/lib/models/MigrateActivity.ts";
import ItemTypes from "@/lib/models/enums/ItemTypes.ts";
import ItemsWithParentData from "@/lib/models/itemsWithParentData.ts";
import { DefaultSelectedItem, SelectAsync } from "@/components/SelectAsync.tsx";

class SelectedItem {
  id: string;
  itemId: string;
  itemName: string;

  public constructor(id: string, itemId: string, itemName: string) {
    this.id = id;
    this.itemId = itemId;
    this.itemName = itemName;
  }
}

export default function ActivityMigrationPage() {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activityData, setActivityData] = useState<Activity[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [migrationLoading, setMigrationLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [seriesMatches, setSeriesMatches] = useState<Record<string, ItemsWithParentData[]>>({});
  const [selectedItem, setSelectedItem] = useState<Record<string, SelectedItem | null>>({});

  const [migrations, setMigrations] = useState<MigrateActivity[]>([]);
  const [selected, setSelected] = useState<Activity[]>([]);

  const migrateableCount = migrations.filter(
    (m) => (m.SeriesId != "" && m.ItemId != "") || (m.SeriesId == "" && m.ItemId != ""),
  ).length;

  // Replace all occurrences of `oldSeriesId` with `newSeriesId` on migrations
  function updateMigrationBySeriesId(oldSeriesId: string, newSeriesId: string) {
    setMigrations((prev) => prev.map((m) => (m.SeriesId === oldSeriesId ? m.copyWith({ SeriesId: newSeriesId }) : m)));
  }

  // Replace all occurrences of `oldSeasonId` with `newSeasonId` on migrations
  function updateMigrationBySeasonId(oldSeasonId: string, newSeasonId: string) {
    setMigrations((prev) => prev.map((m) => (m.SeasonId === oldSeasonId ? m.copyWith({ SeasonId: newSeasonId }) : m)));
  }

  // Replace all occurrences of `oldItemId` with `newItemId` on migrations
  function updateMigrationByItemId(oldItemId: string, newItemId: string) {
    setMigrations((prev) => prev.map((m) => (m.ItemId === oldItemId ? m.copyWith({ ItemId: newItemId }) : m)));
  }

  async function applyMigrations() {
    try {
      setMigrationLoading(true);
      const res = await client.History.migrateActivity(migrations);
      setMigrationLoading(false);
      const failedMigrations = res.filter((m) => !m.success);
      setMigrations(failedMigrations);
      setActivityData([]);
      setPageCount(1);
      setPage(1);
      await fetchPage(1, true);
    } catch (err) {
      console.error(err);
      setMigrationLoading(false);
    }
  }

  async function deleteActivity() {
    if (selected.length == 0) return;
    setDeleteLoading(true);
    const activityIds: string[] = selected.map((a) => a.id!);
    const serverId = selected[0]?.serverId;
    try {
      await client.History.activity.delete(serverId, activityIds);
      setSelected([]);
      setActivityData([]);
      setPageCount(1);
      setPage(1);
      await fetchPage(1, true);
    } catch (err) {
      console.log(err);
    }
    setDeleteLoading(false);
  }

  const fetchMatchingItems = async (id: string) => {
    const activity = activityData.find((a) => a.id === id);
    if (!activity) return [];
    const migration = migrations.find((m) => m.id === id);
    if (!migration) return [];
    try {
      const query = new GridifyQueryBuilder()
        .startGroup()
        .addCondition("type", op.Equal, ItemTypes.Episode.toString())
        .or()
        .addCondition("type", op.Equal, ItemTypes.Movie.toString())
        .endGroup();
      if (migration.SeriesId) query.and().addCondition("rootId", op.Equal, migration.SeriesId);
      const res = await client.Api.getMatchingItems(activity.name, query.build());
      const data = res?.data ?? [];
      return data;
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const fetchPage = useCallback(
    async (pageToLoad: number, replace = false) => {
      setLoading(true);
      setError(null);
      try {
        const query: GridifyQueryBuilder = new GridifyQueryBuilder();
        query.setPage(pageToLoad);
        query.addOrderBy("dateCreated", true);
        const builtQuery = query.build();

        const res = await client.History.getUnlinkedActivity(builtQuery);
        const data = res?.data ?? [];
        const count = res?.count ?? 0;

        const distinctSeriesSet = new Set<string>();
        const seriesMatchesTemp: Record<string, ItemsWithParentData[]> = {};
        data.forEach((activity) => {
          if (activity.seriesName) distinctSeriesSet.add(activity.seriesName);
        });

        // Fetch matching items for each distinct series in parallel and wait for all results
        const seriesArray = Array.from(distinctSeriesSet);
        await Promise.all(
          seriesArray.map(async (series) => {
            const res = await client.Api.getMatchingItems(
              series,
              new GridifyQueryBuilder().addCondition("type", op.Equal, ItemTypes.Series.toString()).build(),
            );
            const data = res?.data ?? [];
            seriesMatchesTemp[series] = data;
          }),
        );

        const tempMigrations: MigrateActivity[] = [];

        for (const activity of data) {
          const migration = new MigrateActivity({
            id: activity.id,
            ServerId: activity.serverId,
            SeriesId: (activity.seriesName && seriesMatchesTemp[activity.seriesName]?.[0]?.id) || activity.seriesId || "",
            SeasonId: activity.seasonId || "",
            ItemId: activity.itemId,
          });
          tempMigrations.push(migration);
        }

        setMigrations((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const toAdd = tempMigrations.filter((m) => !existingIds.has(m.id));
          return toAdd.length ? [...prev, ...toAdd] : prev;
        });

        setPageCount(count);
        setSeriesMatches(seriesMatchesTemp);
        // setSelectedSeries(selectedSeriesTemp);

        setActivityData(data);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error(err);
        setError(err?.message ?? String(err));
      } finally {
        setLoading(false);
      }
    },
    [page],
  );

  useEffect(() => {
    setActivityData([]);
    setPageCount(1);
    setPage(1);
    fetchPage(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchPage(page);
  }, [fetchPage, page]);

  return (
    <div style={{ padding: 20 }}>
      <Group justify="space-between">
        <Group>
          <Title order={2}>Activity Migration</Title>
          {migrations.length > 0 && (
            <Badge size="lg" circle>
              {migrateableCount}
            </Badge>
          )}
        </Group>
        <Group>
          <Button loading={deleteLoading} onClick={deleteActivity} disabled={selected.length == 0} color="red">
            Delete {selected.length > 0 && `(${selected.length})`}
          </Button>
          <Button loading={migrationLoading} onClick={applyMigrations} disabled={migrations.length == 0}>
            Apply Migrations
          </Button>
        </Group>
      </Group>
      <Card shadow="sm" p={0} style={{ width: "100%", marginTop: 12 }}>
        <DataTable
          className={classes.root}
          minHeight={150}
          withTableBorder
          borderRadius="sm"
          //   withColumnBorders
          //   striped
          highlightOnHover
          // provide data
          records={activityData}
          totalRecords={pageCount}
          recordsPerPage={20}
          page={page}
          onPageChange={(p) => setPage(p)}
          fetching={loading}
          selectedRecords={selected}
          onSelectedRecordsChange={setSelected}
          // define columns
          columns={[
            {
              accessor: "seriesName",
              title: "Series",
              render: (activity) => {
                return activity.seriesName ?? "-";
              },
            },
            {
              accessor: "matchedSeries",
              title: "Matched Series",
              render: (activity) => {
                if (!activity.seriesName || !activity.seriesId) return "-";
                const matchedSeries = (seriesMatches[activity.seriesName] ?? []).map((item) => ({
                  value: item.id,
                  label: item.name,
                }));
                const value: string | null = migrations.find((m) => m.id === activity.id)?.SeriesId || null;
                return (
                  <Select
                    placeholder={matchedSeries.length > 0 ? "Select an item" : "No similar items found"}
                    data={matchedSeries}
                    value={value}
                    onChange={(v) => {
                      updateMigrationBySeriesId(activity.seriesId!, v ?? "");
                    }}
                    // searchable
                    mt="sm"
                  />
                );
              },
            },
            {
              accessor: "name",
              title: "Title",
            },
            {
              accessor: "matchedTitle",
              title: "Matched Title",
              render: (activity) => {
                if (!activity.id) return "-";

                return (
                  <SelectAsync<ItemsWithParentData>
                    fetchMethod={() => fetchMatchingItems(activity.id!)}
                    onSelect={(item) => {
                      if (!item) return;
                      if (activity.seasonId && item?.parentId) {
                        updateMigrationBySeasonId(activity.seasonId!, item?.parentId || "");
                      }
                      updateMigrationByItemId(activity.itemId!, item?.id || "");
                      setSelectedItem((prev) => ({
                        ...prev,
                        [activity.id!]: new SelectedItem(activity.id!, item.id, item.name),
                      }));
                    }}
                    idPredicate={(it) => it.id}
                    namePredicate={(it) => it.name}
                    value={
                      selectedItem[activity.id!]
                        ? new DefaultSelectedItem(selectedItem[activity.id!]!.id, selectedItem[activity.id!]!.itemName)
                        : null
                    }
                  />
                );
              },
            },
          ]}
        />
      </Card>
    </div>
  );
}
