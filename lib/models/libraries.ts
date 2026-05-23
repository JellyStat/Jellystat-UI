import LibraryTypes from "./enums/LibraryTypes";

export interface Libraries {
  id: string;
  serverId: string;
  name: string;
  type: LibraryTypes;
  imageTag?: string | null;
  imageHash?: string | null;
  archived?: boolean;
}
