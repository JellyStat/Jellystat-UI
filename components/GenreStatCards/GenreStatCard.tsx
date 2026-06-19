import { PieChart } from "lucide-react";
import { useTranslation } from "next-i18next/pages";

import { GenreStats } from "@/lib/models/genreStats";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, Tooltip } from "recharts";
type Props = {
  data: GenreStats[];
  dataKey: string;
};

export default function GenreStatCard({ data, dataKey }: Props) {
  const { t } = useTranslation("common");
  const hasData = data.length > 0;

  return (
    <div className="w-full">
      <RadarChart
        style={{ width: "100%", height: "100%", maxWidth: "500px", maxHeight: "80vh", aspectRatio: 1 }}
        responsive
        // outerRadius="80%"
        data={data}
        margin={{
          top: 20,
          left: 20,
          right: 20,
          bottom: 20,
        }}
      >
        <PolarGrid />
        <Tooltip />
        <PolarAngleAxis dataKey="name" />
        <Radar name="Play Count" dataKey={dataKey} stroke="#8884d8" fill="#8884d8" fillOpacity={0.8} />
        {/* <RechartsDevtools /> */}
      </RadarChart>
    </div>
  );
}
