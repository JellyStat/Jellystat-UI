import {
  IconArrowsShuffle,
  IconBook2,
  IconDeviceTv,
  IconFileUnknown,
  IconFolder,
  IconLibraryPhoto,
  IconMovie,
  IconMusic,
  IconVideo,
} from "@tabler/icons-react";
import ItemTypes from "../models/enums/ItemTypes";

const ItemTypeIcons: Record<string, any> = {
  [ItemTypes.Movie]: IconMovie,
  [ItemTypes.Audio]: IconMusic,
  [ItemTypes.Series]: IconDeviceTv,
  [ItemTypes.Season]: IconDeviceTv,
  [ItemTypes.Episode]: IconDeviceTv,
  [ItemTypes.Folder]: IconFolder,
  [ItemTypes.Trailer]: IconVideo,
  [ItemTypes.Unknown]: IconFileUnknown,
  [ItemTypes.TvChannel]: IconDeviceTv,
};

export default ItemTypeIcons;
