import { PieChart } from "lucide-react";
import { useTranslation } from "react-i18next";

import { GenreStats } from "@/lib/models/genreStats";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, Tooltip, TooltipContentProps } from "recharts";
import { chartColors } from "@/components/ui";
type Props = {
  data: GenreStats[];
  dataKey: string;
};

export default function GenreStatCard({ data, dataKey }: Props) {
  const { t } = useTranslation("common");

  const CustomTooltip = ({ active, payload, label }: TooltipContentProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface/90 border border-border rounded-xl p-3 text-sm shadow-2xl shadow-black/40">
          <p className="text-sm font-bold text-primary">{label}</p>
          <p>
            {dataKey == "playDuration"
              ? (Number(payload[0].value ?? 0).secondsToDurationString?.() ?? "0")
              : `${payload[0].value} ${t("common.unit.plays", "Plays")}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full flex items-center justify-center [&_svg]:overflow-visible">
      <RadarChart
        style={{ width: "100%", height: "100%", maxWidth: "500px", maxHeight: "80vh", aspectRatio: 1 }}
        responsive
        outerRadius="80%"
        data={data}
        margin={{
          top: 20,
          left: 20,
          right: 20,
          bottom: 20,
        }}
      >
        {/* <PolarGrid /> */}
        <Tooltip content={CustomTooltip} cursor={false} />
        <PolarAngleAxis dataKey="name" />
        <Radar
          name="Play Count"
          dataKey={dataKey}
          stroke={chartColors.primary}
          fill={chartColors.primary}
          fillOpacity={0.6}
        />
        {/* <RechartsDevtools /> */}
      </RadarChart>
    </div>
  );
}
