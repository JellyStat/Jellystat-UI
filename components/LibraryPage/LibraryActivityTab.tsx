import { useMemo } from "react";
import type { LibrariesWithStats } from "@/lib/models/librariesWithStats";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";

import { ActivityTable } from "@/components/ActivityTable/ActivityTable";

type Props = {
  library: LibrariesWithStats | null;
};

export default function LibraryActivity({ library }: Props) {
  // Memoize the query builder so it only recreates if the library ID changes
  const libraryMediaQuery = useMemo(() => {
    if (!library?.id) return null;
    
    return new GridifyQueryBuilder()
      .addCondition("LibraryId", op.Equal, library.id);
  }, [library?.id]);

  if (!library || !libraryMediaQuery) return null;

  return (
    <div className="w-full animate-in fade-in duration-500 pt-2">
      <ActivityTable gridify={libraryMediaQuery} />
    </div>
  );
}