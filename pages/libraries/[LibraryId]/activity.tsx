import { Title, Text, Card } from "@mantine/core";
import type { LibrariesWithStats } from "@/lib/models/librariesWithStats";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";

import { Activity, useMemo } from "react";
import { ActivityTable } from "@/components/ActivityTable/ActivityTable";

type Props = {
  library: LibrariesWithStats | null;
};

export default function LibraryActivity({ library }: Props) {
  if (!library) return null;

  const libraryMediaQuery = useMemo(
    () => new GridifyQueryBuilder().addCondition("LibraryId", op.Equal, library.id),
    [library.id],
  );

  return (
    <div style={{ padding: 20 }}>
      <ActivityTable gridify={libraryMediaQuery} />
    </div>
  );
}
