import StatsCard from "@/components/StatsCard/StatsCard";
import StatType from "@/lib/models/enums/StatType";
import type { ItemsWithStats } from "@/lib/models/itemsWithStats";

type Props = {
  item: ItemsWithStats | null;
};

export default function ItemOverview({ item }: Props) {
  if (!item) return null;

  return (
    <div className="w-full animate-in fade-in duration-500 pt-4">
      <StatsCard type={StatType.Item} id={item.id} />
    </div>
  );
}