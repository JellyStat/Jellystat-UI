import { Title, Text, Card } from "@mantine/core";
import type { LibrariesWithStats } from "@/lib/models/librariesWithStats";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";

import { Activity, useMemo } from "react";
import { ActivityTable } from "@/components/ActivityTable/ActivityTable";

export default function ActivityPage() {
  //   const libraryMediaQuery = useMemo(
  //     () => new GridifyQueryBuilder().addCondition("LibraryId", op.Equal, library.id),
  //     [library.id],
  //   );

  return (
    <div style={{ padding: 20 }}>
      <ActivityTable />
    </div>
  );
}
