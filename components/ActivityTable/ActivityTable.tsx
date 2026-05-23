import Activity from "@/lib/models/activity";
import { Box, Card, Group, NavLink, Text, Title } from "@mantine/core";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";
import { DataTable, DataTableSortStatus } from "mantine-datatable";
import { useCallback, useEffect, useState } from "react";
import client from "@/lib/api";
import { IconCircleMinus, IconCirclePlusFilled } from "@tabler/icons-react";
import clsx from "clsx";
import classes from "./ActivityTable.module.css";
import { BaseTranscodingInfo } from "@/lib/models/baseTranscodingInfo";
import TextFilter from "../DataTableFilters/TextFilter";
import { DatesRangeValue } from "@mantine/dates";
import DateFilter from "../DataTableFilters/DateFilter";
import useFilters from "../DataTableFilters/useFilters";

type Props = {
  gridify?: GridifyQueryBuilder | null;
  GroupResults?: boolean;
};

export function ActivityTable({ gridify, GroupResults }: Props) {
  const [activityData, setActivityData] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<Activity>>({
    columnAccessor: "dateCreated",
    direction: "desc",
  });
  const { filter, addOrReplaceFilter, removeFilter, getFilterValueOrDefault, isFilterActive, applyFiltersToQuery } = useFilters();

  const [pageCount, setPageCount] = useState(1);

  const [expandedActivityIds, setExpandedActivityIds] = useState<string[]>([]);

  const fetchPage = useCallback(
    async (pageToLoad: number, replace = false) => {
      setLoading(true);
      setError(null);
      try {
        const query: GridifyQueryBuilder = gridify ? new GridifyQueryBuilder({ from: gridify }) : new GridifyQueryBuilder();
        query.setPage(pageToLoad);
        console.log("Current sort status:", sortStatus);
        console.log("Current query:", query.build());

        applyFiltersToQuery(query);
        query.addOrderBy(sortStatus.columnAccessor, sortStatus.direction === "desc");
        const builtQuery = query.build();
        console.log("Fetching activity with query:", builtQuery);

        const res = await client.History.activity.get(builtQuery, { GroupResults: GroupResults });
        const data = res?.data ?? [];
        const count = res?.count ?? 0;
        setPageCount(count);

        setActivityData(data);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error(err);
        setError(err?.message ?? String(err));
      } finally {
        setLoading(false);
      }
    },
    [gridify, sortStatus, filter, GroupResults],
  );

  // initial load & when filter or sort changes
  useEffect(() => {
    console.log("Gridify or sort status changed, resetting page and activity data");
    setActivityData([]);
    setPageCount(1);
    // setHasMore(true);
    setPage(1);
    fetchPage(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridify]);

  useEffect(() => {
    fetchPage(page);
  }, [fetchPage, page, filter, sortStatus]);

  useEffect(() => {
    console.log("Filter changed:", filter);
  }, [filter]);

  return (
    <div>
      <Group align="center" justify="space-between">
        <Title order={2}>Activity</Title>
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
          sortStatus={sortStatus}
          onSortStatusChange={setSortStatus}
          fetching={loading}
          // define columns
          columns={[
            {
              accessor: "expanded",
              title: "Expand",
              noWrap: true,
              render: ({ id, groupedResults }) => {
                if (groupedResults && groupedResults.length > 1) {
                  if (expandedActivityIds.includes(id ?? "")) {
                    return (
                      <Box component="span" ml={20}>
                        <IconCircleMinus
                          className={clsx(classes.icon, classes.expandIcon, {
                            [classes.expandIconRotated]: expandedActivityIds.includes(id ?? ""),
                          })}
                        />
                      </Box>
                    );
                  }
                  return (
                    <Box component="span" ml={20}>
                      <IconCirclePlusFilled
                        className={clsx(classes.icon, classes.expandIcon, {
                          [classes.expandIconRotated]: expandedActivityIds.includes(id ?? ""),
                        })}
                      />
                    </Box>
                  );
                }
              },
            },
            {
              accessor: "userName",
              title: "User",
              textAlign: "right",
              sortable: true,
              filter: (
                <TextFilter
                  keyName="userName"
                  value={getFilterValueOrDefault("userName", "") as string}
                  onChange={(value) => (value ? addOrReplaceFilter(value) : removeFilter("userName"))}
                />
              ),
              filtering: isFilterActive("userName"),
            },
            {
              accessor: "ipAddress",
              title: "IP Address",
              sortable: true,
              filter: (
                <TextFilter
                  keyName="ipAddress"
                  value={getFilterValueOrDefault("ipAddress", "") as string}
                  onChange={(value) => (value ? addOrReplaceFilter(value) : removeFilter("ipAddress"))}
                />
              ),
              filtering: isFilterActive("ipAddress"),
            },
            {
              accessor: "name",
              title: "Title",
              render: (activity) => {
                const name = activity.name ?? "Unknown";
                const seriesName = activity.seriesName;
                const episodeIndex = `S${activity.item?.parentIndex?.toString().padStart(2, "0") ?? "??"}E${activity.item?.index?.toString().padStart(2, "0") ?? "??"}`;
                const display = seriesName ? `${seriesName} : ${episodeIndex} - ${name}` : name;
                const href = `/libraries/items/${activity.itemId}`;
                //return <Text>{display}</Text>;
                return <NavLink href={href} key={activity.id} label={display} />;
              },
              sortable: true,
              filter: (
                <TextFilter
                  keyName="name"
                  value={getFilterValueOrDefault("name", "") as string}
                  onChange={(value) => (value ? addOrReplaceFilter(value) : removeFilter("name"))}
                />
              ),
              filtering: isFilterActive("name"),
            },
            {
              accessor: "client",
              title: "Client",
              sortable: true,
              filter: (
                <TextFilter
                  keyName="client"
                  value={getFilterValueOrDefault("client", "") as string}
                  onChange={(value) => (value ? addOrReplaceFilter(value) : removeFilter("client"))}
                />
              ),
              filtering: isFilterActive("client"),
            },
            {
              accessor: "transcodingInfo",
              title: "Transcode",
              render: (activity) => {
                const transcodingInfo = activity.transcodingInfo;
                if (transcodingInfo == null) return <Text>Direct</Text>;
                const info = transcodingInfo as BaseTranscodingInfo;
                var display = "Transcoding";
                if (info.isVideoDirect == false) display += " (Video)";
                if (!info.isAudioDirect == false) display += " (Audio)";
                return <Text>{display}</Text>;
              },
              sortable: true,
            },

            {
              accessor: "device",
              title: "Device",
              sortable: true,
              filter: (
                <TextFilter
                  keyName="device"
                  value={getFilterValueOrDefault("device", "") as string}
                  onChange={(value) => (value ? addOrReplaceFilter(value) : removeFilter("device"))}
                />
              ),
              filtering: isFilterActive("device"),
            },
            {
              accessor: "dateCreated",
              title: "Date Created",
              render: (activity) => {
                if (!activity.dateCreated) return <Text>-</Text>;
                const date = new Date(activity.dateCreated);
                return <Text>{date.toLocaleString()}</Text>;
              },
              sortable: true,
              filter: (
                <DateFilter
                  keyName="dateCreated"
                  value={getFilterValueOrDefault("dateCreated", [null, null]) as DatesRangeValue}
                  onChange={(value) => (value ? addOrReplaceFilter(value) : removeFilter("dateCreated"))}
                />
              ),
              filtering: isFilterActive("dateCreated"),
            },
            {
              accessor: "playCount",
              title: "Play Count",
              textAlign: "center",
              sortable: true,
            },

            {
              accessor: "playDuration",
              title: "Total Playback",
              render: (activity) => {
                if (!activity.playDuration) return <Text>-</Text>;
                return <Text>{activity.playDuration.secondsToDurationString()}</Text>;
              },
              sortable: true,
            },
            // { accessor: "playCount", title: "Play Count" },
          ]}
          rowExpansion={{
            expanded: { recordIds: expandedActivityIds, onRecordIdsChange: setExpandedActivityIds },
            expandable(params) {
              return params.record.playCount != null && params.record.playCount > 1;
            },
            content: (groupedActivity) => (
              <DataTable
                // noHeader
                // withColumnBorders
                withTableBorder
                className={classes.subRoot}
                records={groupedActivity?.record?.groupedResults ?? []}
                columns={[
                  {
                    accessor: "userName",
                    title: "User",
                    textAlign: "right",
                  },
                  { accessor: "ipAddress", title: "IP Address" },
                  {
                    accessor: "name",
                    title: "Title",
                    render: (activity) => {
                      const name = activity.name ?? "Unknown";
                      const seriesName = activity.seriesName;
                      const episodeIndex = `S${activity.item?.parentIndex?.toString().padStart(2, "0") ?? "??"}E${activity.item?.index?.toString().padStart(2, "0") ?? "??"}`;
                      const display = seriesName ? `${seriesName} : ${episodeIndex} - ${name}` : name;
                      const href = `/libraries/items/${activity.itemId}`;
                      //return <Text>{display}</Text>;
                      return <NavLink href={href} key={activity.id} label={display} />;
                    },
                  },
                  { accessor: "client", title: "Client" },
                  {
                    accessor: "transcodingInfo",
                    title: "Transcode",
                    render: (activity) => {
                      const transcodingInfo = activity.transcodingInfo;
                      if (transcodingInfo == null) return <Text>Direct</Text>;
                      const info = transcodingInfo as BaseTranscodingInfo;
                      var display = "Transcoding";
                      if (info.isVideoDirect == false) display += " (Video)";
                      if (!info.isAudioDirect == false) display += " (Audio)";
                      return <Text>{display}</Text>;
                    },
                  },

                  { accessor: "device", title: "Device" },
                  {
                    accessor: "dateCreated",
                    title: "Date Created",
                    render: (activity) => {
                      if (!activity.dateCreated) return <Text>-</Text>;
                      const date = new Date(activity.dateCreated);
                      return <Text>{date.toLocaleString()}</Text>;
                    },
                  },
                  {
                    accessor: "playCount",
                    title: "Play Count",
                  },

                  {
                    accessor: "playDuration",
                    title: "Total Playback",
                    render: (activity) => {
                      if (!activity.playDuration) return <Text>-</Text>;
                      return <Text>{activity.playDuration.secondsToDurationString()}</Text>;
                    },
                  },
                ]}
              />
            ),
          }}
        />
      </Card>
    </div>
  );
}
