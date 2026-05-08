export interface AddServer {
  url: string;
  externalURL?: string;
  apiKey?: string;
  type?: "Jellyfin" | "Emby";
}
