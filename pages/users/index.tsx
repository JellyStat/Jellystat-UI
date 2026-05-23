import { Avatar, Card, Group, NavLink, Switch, Text, Title } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";
import { DataTable, DataTableSortStatus } from "mantine-datatable";
import { useCallback, useEffect, useState } from "react";
import client, { API_BASE } from "@/lib/api.ts";
import { IconUser } from "@tabler/icons-react";

import { TrackedUsers } from "../../lib/models/trackedUsers.ts";
import TextFilter from "../../components/DataTableFilters/TextFilter.tsx";
import useFilters from "../../components/DataTableFilters/useFilters.tsx";
import BooleanFilter from "../../components/DataTableFilters/BooleanFilter.tsx";
// import DateFilter from "./DateFilter";

export default function UsersPage() {
  const [userData, setUserData] = useState<TrackedUsers[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<TrackedUsers>>({
    columnAccessor: "latestActivityDate",
    direction: "desc",
  });

  const { filter, addOrReplaceFilter, removeFilter, getFilterValueOrDefault, isFilterActive, applyFiltersToQuery } = useFilters();

  const [pageCount, setPageCount] = useState(1);

  function toggleUserTracking(userId: string, tracked: boolean) {
    const payload = userData.find((u) => u.id === userId);

    if (!payload) return;
    payload.tracked = tracked;
    setUserData((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return payload;
        }
        return u;
      }),
    );

    client.Api.trackedUsers.post([payload!]).catch((err) => {
      // Revert optimistic update
      setUserData((prev) =>
        prev.map((u) => {
          if (u.id === userId) {
            return { ...u, tracked: !tracked };
          }
          return u;
        }),
      );
      showNotification({
        title: "Error",
        message: `Failed to update tracking for user: ${err?.message ?? String(err)}`,
        color: "red",
      });
    });
  }

  const fetchPage = useCallback(
    async (pageToLoad: number, replace = false) => {
      setLoading(true);
      setError(null);
      try {
        const query: GridifyQueryBuilder = new GridifyQueryBuilder();
        query.setPage(pageToLoad);

        console.log("Current sort status:", sortStatus);
        console.log("Current query:", query.build());
        applyFiltersToQuery(query);
        query.addOrderBy(sortStatus.columnAccessor, sortStatus.direction === "desc");
        const builtQuery = query.build();
        console.log("Fetching activity with query:", builtQuery);

        const res = await client.Api.trackedUsers.get(builtQuery);
        const data = res?.data ?? [];
        const count = res?.count ?? 0;
        setPageCount(count);

        setUserData(data);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error(err);
        setError(err?.message ?? String(err));
      } finally {
        setLoading(false);
      }
    },
    [sortStatus, filter],
  );

  useEffect(() => {
    fetchPage(page);
  }, [fetchPage, page, sortStatus, filter]);

  return (
    <div>
      <Group align="center" justify="space-between">
        <Title order={2}>Users</Title>
      </Group>
      <Card shadow="sm" p={0} style={{ width: "100%", marginTop: 12 }}>
        <DataTable
          //   className={classes.root}
          minHeight={150}
          withTableBorder
          borderRadius="sm"
          //   withColumnBorders
          //   striped
          highlightOnHover
          // provide data
          records={userData}
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
              accessor: "imageTag",
              render: (user) => {
                if (!user.imageTag) return <IconUser size={40} />;
                const userImage = `${API_BASE}Proxy/Images/User/Primary?ServerId=${encodeURIComponent(user.serverId ?? "")}&Id=${encodeURIComponent(user.id)}&Width=80`;
                return <Avatar src={userImage} alt={user.username} />;
              },
            },
            {
              accessor: "username",
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
              accessor: "tracked",
              title: "Tracked",
              //   textAlign: "right",
              sortable: true,
              render: (user) => (
                <Switch
                  checked={user.tracked}
                  onChange={(event) => {
                    toggleUserTracking(user.id, event.currentTarget.checked);
                  }}
                />
              ),
              filter: (
                <BooleanFilter
                  keyName="tracked"
                  label="Tracked"
                  value={getFilterValueOrDefault("tracked", null) as boolean | null}
                  onChange={(value) => (value ? addOrReplaceFilter(value) : removeFilter("tracked"))}
                />
              ),
              filtering: isFilterActive("tracked"),
            },
            {
              accessor: "latestActivity",
              title: "Last Watched",
              render: (user) => {
                const activity = user.latestActivity;
                const item = user.item;
                if (!activity || !activity.dateCreated) return <Text>-</Text>;

                const name = activity.name ?? "Unknown";
                const seriesName = activity.seriesName;
                const episodeIndex = `S${item?.parentIndex?.toString().padStart(2, "0") ?? "??"}E${item?.index?.toString().padStart(2, "0") ?? "??"}`;
                const hasEpisodeIndex = item?.parentIndex != null && item?.index != null;
                const display = seriesName ? `${seriesName} : ${hasEpisodeIndex ? episodeIndex + " - " : ""}${name}` : name;
                const href = `/items/${activity.itemId}`;
                //return <Text>{display}</Text>;
                return <NavLink href={href} key={activity.id} label={display} />;
              },
              //   sortable: true,
              //   filter: (
              //     <TextFilter
              //       keyName="name"
              //       value={getFilterValueOrDefault("name", "") as string}
              //       onChange={(value) => (value ? addOrReplaceFilter(value) : removeFilter("name"))}
              //     />
              //   ),
              //   filtering: isFilterActive("name"),
            },
            {
              accessor: "client",
              title: "Client",
              render: (activity) => activity.latestActivity?.client ?? "-",
              //   sortable: true,
              //   filter: (
              //     <TextFilter
              //       keyName="client"
              //       value={getFilterValueOrDefault("client", "") as string}
              //       onChange={(value) => (value ? addOrReplaceFilter(value) : removeFilter("client"))}
              //     />
              //   ),
              //   filtering: isFilterActive("client"),
            },
            {
              accessor: "playCount",
              title: "Plays",
              sortable: true,
            },

            {
              accessor: "playDuration",
              title: "Watch Time",
              render: (activity) => {
                if (!activity.playDuration) return <Text>-</Text>;
                return <Text>{activity.playDuration.secondsToDurationString()}</Text>;
              },
              sortable: true,
              //   filter: (
              //     <TextFilter
              //       keyName="device"
              //       value={getFilterValueOrDefault("device", "") as string}
              //       onChange={(value) => (value ? addOrReplaceFilter(value) : removeFilter("device"))}
              //     />
              //   ),
              //   filtering: isFilterActive("device"),
            },
            {
              accessor: "latestActivityDate",
              title: "Last Activity Date",
              render: (user) => {
                const activity = user.latestActivity;
                if (!activity || !activity.dateCreated) return <Text>-</Text>;
                const date = new Date(activity.dateCreated);
                const difference = activity.dateCreated ? Date.now() - new Date(activity.dateCreated).getTime() : null;
                const differenceString = difference?.formatTimeDifference();

                return <Text>{differenceString}</Text>;
              },
              sortable: true,
              //   filter: (
              //     <DateFilter
              //       keyName="dateCreated"
              //       value={getFilterValueOrDefault("dateCreated", [null, null]) as DatesRangeValue}
              //       onChange={(value) => (value ? addOrReplaceFilter(value) : removeFilter("dateCreated"))}
              //     />
              //   ),
              //   filtering: isFilterActive("dateCreated"),
            },
          ]}
        />
      </Card>
    </div>
  );
}
