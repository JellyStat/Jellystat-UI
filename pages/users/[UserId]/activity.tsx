import { useMemo } from "react";
import type { LibrariesWithStats } from "@/lib/models/librariesWithStats";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";

import { ActivityTable } from "@/components/ActivityTable/ActivityTable";
import { Users } from "@/lib/models/users";

type Props = {
  user: Users | null;
};

export default function UserActivity({ user }: Props) {
  // Memoize the query builder so it only recreates if the user ID changes
  const userActivityQuery = useMemo(() => {
    if (!user?.id) return null;

    return new GridifyQueryBuilder().addCondition("UserId", op.Equal, user.id);
  }, [user?.id]);

  if (!user || !userActivityQuery) return null;

  return (
    <div className="w-full animate-in fade-in duration-500 pt-2">
      <ActivityTable gridify={userActivityQuery} />
    </div>
  );
}
