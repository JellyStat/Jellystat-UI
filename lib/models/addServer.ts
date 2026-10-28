export interface AddServer {
  /** Set when editing an existing server. Leave apiKey blank to keep the stored key. */
  id?: string;
  url: string;
  externalURL?: string;
  apiKey?: string;
  type?: "Jellyfin" | "Emby";
}
