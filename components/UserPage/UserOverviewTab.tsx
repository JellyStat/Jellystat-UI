import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";
import { PieChart } from "lucide-react";

import type { LibrariesWithStats } from "@/lib/models/librariesWithStats";
import ItemTypes from "@/lib/models/enums/ItemTypes";
import StatType from "@/lib/models/enums/StatType";

import StatsCard from "@/components/StatsCard/StatsCard";
import LastWatched from "@/components/LastWatched/LastWatched";
import GenreStatsCard from "@/components/GenreStatCards/GenreStats";
import { Users } from "@/lib/models/users";

type Props = {
  user: Users | null;
};

export default function UserOverView({ user }: Props) {
  const { t } = useTranslation("common");

  const lastWatchedQuery = useMemo(() => {
    if (!user) return undefined;
    return new GridifyQueryBuilder().addCondition("UserId", op.Equal, user.id);
  }, [user]);

  if (!user) return null;

  const gridify = new GridifyQueryBuilder().addCondition("activity.UserId", op.Equal, user.id).build();

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pt-6">
      {/* User Stats */}
      <div className="w-full">
        <StatsCard type={StatType.User} id={user.id ?? ""} />
      </div>

      {/* Genres Chart */}
      <div className="w-full">
        <GenreStatsCard gridify={gridify} />
      </div>

      {/* Last Watched Section */}
      <div className="w-full">
        <LastWatched gridify={lastWatchedQuery} />
      </div>
    </div>
  );
}
