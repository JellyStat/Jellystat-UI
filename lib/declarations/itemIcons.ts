import {
  Film,
  Music,
  Tv,
  Folder,
  Video,
  FileQuestion,
  LucideIcon
} from "lucide-react";
import ItemTypes from "../models/enums/ItemTypes";

const ItemTypeIcons: Record<string, LucideIcon> = {
  [ItemTypes.Movie]: Film,
  [ItemTypes.Audio]: Music,
  [ItemTypes.Series]: Tv,
  [ItemTypes.Season]: Tv,
  [ItemTypes.Episode]: Tv,
  [ItemTypes.Folder]: Folder,
  [ItemTypes.Trailer]: Video,
  [ItemTypes.Unknown]: FileQuestion,
  [ItemTypes.TvChannel]: Tv,
};

export default ItemTypeIcons;