import { AreaChart } from "@mantine/charts";
import { Card, Group, Title, Select } from "@mantine/core";
import client from "@/lib/api";
import { ChartStats } from "@/lib/models/chartStats";
import { useCallback, useEffect, useState } from "react";
import { ChartStat } from "@/lib/models/chartStat";

// import DateFilter from "./DateFilter";

export default function UsersPage() {
  const [stats, setStats] = useState<ChartStats[]>([]);
  const [metric, setMetric] = useState<keyof ChartStat>("count");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.Stats.getStatsByDay({ days: 31 });

      setStats(data);
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      console.error(err);
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  // Transform row-oriented ChartStats[] into Mantine AreaChart shape.
  function buildChartFromRows(rows: ChartStats[], metric: keyof ChartStat) {
    // collect all legend keys (series names)
    const legends = Array.from(new Set(rows.flatMap((r) => r.stats.map((s) => s.legend))));

    // data: one object per row (e.g. per day) with properties for each legend
    const data = rows.map((r) => {
      const row: Record<string, any> = { key: r.key };
      for (const s of r.stats) row[s.legend] = s[metric] ?? 0;
      // ensure all legends exist on row
      for (const l of legends) if (row[l] === undefined) row[l] = 0;
      return row;
    });

    const colors = ["indigo.6", "blue.6", "teal.6", "orange.6", "grape.6"];
    const series = legends.map((l, i) => ({ name: l, dataKey: l, color: colors[i % colors.length] }));
    return { data, series };
  }

  const { data: chartData, series: chartSeries } = buildChartFromRows(stats, metric);

  return (
    <div>
      <Group align="center" justify="space-between">
        <Title order={2}>Statistics</Title>
      </Group>
      <Card shadow="sm" p={0} style={{ width: "100%", marginTop: 12 }}>
        <div style={{ padding: 12 }}>
          <Group style={{ marginBottom: 8 }}>
            <Select
              size="xs"
              value={metric}
              onChange={(v) => setMetric((v as keyof ChartStat) ?? "count")}
              data={[
                { value: "count", label: "Count" },
                { value: "playDuration", label: "Play Duration" },
              ]}
            />
          </Group>
        </div>
        <AreaChart
          h={300}
          data={chartData}
          dataKey="key"
          valueFormatter={(value) => (metric === "playDuration" ? `${value.secondsToDurationString() ?? 0}` : `${value} Views`)}
          type="stacked"
          withLegend
          legendProps={{ verticalAlign: "bottom", height: 50 }}
          series={chartSeries}
        />
      </Card>
    </div>
  );
}
