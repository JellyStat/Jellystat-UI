import {
  IconArrowsShuffle,
  IconBook2,
  IconDeviceTv,
  IconFileUnknown,
  IconLibraryPhoto,
  IconMovie,
  IconMusic,
  IconVideo,
} from "@tabler/icons-react";
import LibraryTypes from "../models/enums/LibraryTypes";

const LibraryTypeIcons: Record<string, any> = {
  [LibraryTypes.Series]: IconDeviceTv,
  [LibraryTypes.BoxSets]: IconLibraryPhoto,
  [LibraryTypes.Movies]: IconMovie,
  [LibraryTypes.Music]: IconMusic,
  [LibraryTypes.HomeVideos]: IconVideo,
  [LibraryTypes.MusicVideos]: IconVideo,
  [LibraryTypes.Books]: IconBook2,
  [LibraryTypes.Mixed]: IconArrowsShuffle,
  [LibraryTypes.Unknown]: IconFileUnknown,
};

export default LibraryTypeIcons;
