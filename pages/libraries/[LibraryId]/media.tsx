import { useMemo } from "react";
import type { LibrariesWithStats } from "@/lib/models/librariesWithStats";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";
import ItemTypes from "@/lib/models/enums/ItemTypes";
import MediaGrid from "@/components/MediaGrid/MediaGrid";

type Props = {
  library: LibrariesWithStats | null;
};

export default function LibraryMedia({ library }: Props) {
  const libraryMediaQuery = useMemo(() => {
    if (!library?.id) return null;

    return new GridifyQueryBuilder()
      .addCondition("LibraryId", op.Equal, library.id)
      .and()
      .startGroup()
      .addCondition("Type", op.Equal, ItemTypes.Movie.toString())
      .or()
      .addCondition("Type", op.Equal, ItemTypes.Series.toString())
      .endGroup();
  }, [library?.id]);

  if (!library || !libraryMediaQuery) return null;

  return (
    <div className="w-full animate-in fade-in duration-500 pt-2">
      <MediaGrid gridify={libraryMediaQuery} />
    </div>
  );
}