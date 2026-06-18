import {
  Shuffle,
  Book,
  Tv,
  FileQuestion,
  Images,
  Film,
  Music,
  Video,
} from "lucide-react";

import LibraryTypes from "@/lib/models/enums/LibraryTypes";

const LibraryTypeIcons: Record<string, any> = {
  [LibraryTypes.Series]: Tv,
  [LibraryTypes.BoxSets]: Images,
  [LibraryTypes.Movies]: Film,
  [LibraryTypes.Music]: Music,
  [LibraryTypes.HomeVideos]: Video,
  [LibraryTypes.MusicVideos]: Video,
  [LibraryTypes.Books]: Book,
  [LibraryTypes.Mixed]: Shuffle,
  [LibraryTypes.Unknown]: FileQuestion,
};

export default LibraryTypeIcons;