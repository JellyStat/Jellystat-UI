import { Card, Container, FloatingIndicator, Select, Tabs, Text, Title } from "@mantine/core";
import { useCallback, useEffect, useState } from "react";
import classes from "@/components/ActivityTable/ActivityTable.module.css";
import { DataTable } from "mantine-datatable";
import Activity, { BaseTranscodingInfo } from "@/lib/models/activity";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";
import client from "@/lib/api";
import { Items } from "@/lib/models/items";
import LibraryTypes from "@/lib/models/enums/LibraryTypes";

export default function ActivityMigrationPage() {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activityData, setActivityData] = useState<Activity[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [expandedActivityIds, setExpandedActivityIds] = useState<string[]>([]);

  const [seriesMatches, setSeriesMatches] = useState<Record<string, Items[]>>({});
  const [selectedSeries, setSelectedSeries] = useState<Record<string, string | null>>({});

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
        const seriesMatchesTemp: Record<string, Items[]> = {};
        const selectedSeriesTemp: Record<string, string | null> = { ...selectedSeries };
        data.forEach((activity) => {
          if (activity.seriesName) distinctSeriesSet.add(activity.seriesName);
        });

        // Fetch matching items for each distinct series in parallel and wait for all results
        const seriesArray = Array.from(distinctSeriesSet);
        await Promise.all(
          seriesArray.map(async (series) => {
            const res = await client.Api.getMatchingItems(
              series,
              new GridifyQueryBuilder().addCondition("type", op.Equal, LibraryTypes.Series.toString()).build(),
            );
            const data = res?.data ?? [];
            seriesMatchesTemp[series] = data;
            if (data.length > 0 && !selectedSeriesTemp[series]) {
              selectedSeriesTemp[series] = data[0].id;
            }
          }),
        );

        setPageCount(count);
        setSeriesMatches(seriesMatchesTemp);
        setSelectedSeries(selectedSeriesTemp);

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
      <Title order={2}>Activity Migration</Title>
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
          // define columns
          columns={[
            {
              accessor: "name",
              title: "Title",
            },
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
                if (!activity.seriesName) return "-";
                const matchedSeries = (seriesMatches[activity.seriesName] ?? []).map((item) => ({
                  value: item.id,
                  label: item.name,
                }));
                const value: string | null = selectedSeries[activity.seriesName] ?? null;
                return (
                  <Select
                    placeholder={matchedSeries.length > 0 ? "Select a series" : "No similar items found"}
                    data={matchedSeries}
                    value={value}
                    onChange={(v) => {
                      setSelectedSeries((prev) => ({ ...prev, [activity.seriesName!]: v }));
                    }}
                    // searchable
                    mt="sm"
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
