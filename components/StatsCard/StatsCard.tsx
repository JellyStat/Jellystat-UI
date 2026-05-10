import React, { useEffect, useMemo, useState } from "react";
import { Card, Title, Group, Popover, Checkbox, Button, SimpleGrid, Text, Loader, ActionIcon } from "@mantine/core";
import { IconDotsVertical } from "@tabler/icons-react";
import client from "@/lib/api";
import StatType from "@/lib/models/enums/StatType";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";

type Props = {
  type: StatType;
  id: string;
};

const PERIODS: Array<{ key: string; label: string; days: number }> = [
  { key: "1", label: "Last 24 Hours", days: 1 },
  { key: "7", label: "Last 7 Days", days: 7 },
  { key: "30", label: "Last 30 Days", days: 30 },
  { key: "180", label: "Last 180 Days", days: 180 },
  { key: "365", label: "Last 365 Days", days: 365 },
  { key: "0", label: "All Time", days: 0 },
];

export default function StatsCard({ type, id }: Props) {
  const title = (() => {
    switch (type) {
      case StatType.Library:
        return "Library Stats";
      case StatType.Item:
        return "Item Stats";
      case StatType.User:
        return "User Stats";
      default:
        return "Stats";
    }
  })();

  // default: show 1,7,30,0 like the screenshot
  const defaultSelected = useMemo(() => new Set([1, 7, 30, 0]), []);
  const [selected, setSelected] = useState<Set<number>>(defaultSelected);
  const [open, setOpen] = useState(false);

  const [loadingMap, setLoadingMap] = useState<Record<number, boolean>>({});
  const [statsMap, setStatsMap] = useState<Record<number, { plays: number; seconds: number }>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch stats for selected periods
    let mounted = true;
    async function fetchFor(days: number) {
      setLoadingMap((m) => ({ ...m, [days]: true }));
      setError(null);
      try {
        let res: any = null;
        if (type === StatType.Library)
          res = await client.Stats.getLibraryStats({ days }, new GridifyQueryBuilder().addCondition("Id", op.Equal, id).build());
        else if (type === StatType.Item)
          res = await client.Stats.getItemStats({ days }, new GridifyQueryBuilder().addCondition("Id", op.Equal, id).build());
        else res = await client.Stats.getUserStats({ days }, new GridifyQueryBuilder().addCondition("Id", op.Equal, id).build());

        // aggregate
        const arr = res?.data ?? [];
        let plays = 0;
        let seconds = 0;
        for (const it of arr) {
          const p = Number(it.playCount ?? 0) || 0;
          const s = Number(it.playDuration ?? 0) || 0;
          plays += p;
          seconds += s;
        }

        if (!mounted) return;
        setStatsMap((m) => ({ ...m, [days]: { plays, seconds } }));
      } catch (er: any) {
        console.error("Stats fetch failed", er);
        if (!mounted) return;
        setError(er?.message ?? String(er));
      } finally {
        if (!mounted) return;
        setLoadingMap((m) => ({ ...m, [days]: false }));
      }
    }

    // Kick off fetches for all selected periods
    for (const d of Array.from(selected.values())) {
      fetchFor(d);
    }

    return () => {
      mounted = false;
    };
  }, [selected, type]);

  function toggleDays(days: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(days)) next.delete(days);
      else next.add(days);
      return next;
    });
  }

  return (
    <div>
      <Group align="center" justify="space-between">
        <Title order={2}>{title}</Title>
        <Popover opened={open} onClose={() => setOpen(false)} position="bottom-end" withArrow>
          <Popover.Target>
            <ActionIcon variant="filled" aria-label="Settings" onClick={() => setOpen((o) => !o)}>
              <IconDotsVertical style={{ width: "70%", height: "70%" }} />
            </ActionIcon>
          </Popover.Target>
          <Popover.Dropdown>
            {PERIODS.map((p) => (
              <Checkbox
                key={p.key}
                label={p.label}
                checked={selected.has(p.days)}
                onChange={() => toggleDays(p.days)}
                style={{ display: "block", marginBottom: 8 }}
              />
            ))}
          </Popover.Dropdown>
        </Popover>
      </Group>

      <Card style={{ marginTop: 12 }}>
        {error && <Text color="red">{error}</Text>}

        <SimpleGrid cols={Math.max(1, selected.size)} spacing="lg">
          {Array.from(selected).map((days) => {
            const stat = statsMap[days];
            const loading = !!loadingMap[days];
            return (
              <div key={String(days)} style={{ padding: 12 }}>
                <Text size="sm" color="dimmed">
                  {PERIODS.find((p) => p.days === days)?.label ?? `${days} days`}
                </Text>
                {loading ? (
                  <Loader />
                ) : (
                  <>
                    <Text color="blue" size="xl" style={{ fontWeight: 700 }}>
                      {stat?.plays ?? 0} Plays
                    </Text>
                    <Text size="sm" color="dimmed">
                      {stat?.seconds ? ((stat.seconds as any).secondsToDurationString?.() ?? `${stat.seconds} sec`) : "0 Seconds"}
                    </Text>
                  </>
                )}
              </div>
            );
          })}
        </SimpleGrid>
      </Card>
    </div>
  );
}
