import type Permissions from "./enums/Permissions";

export interface ApiKeyInfo {
  id: string;
  name: string;
  /** First characters of the key, safe to display. */
  keyPrefix: string;
  permission: Permissions;
  /** Set for read-only keys, which are scoped to a single server. */
  serverId?: string | null;
  createdAt: string;
  lastUsedAt?: string | null;
  createdBy?: string | null;
}

export interface CreateApiKey {
  name: string;
  permission: Permissions;
  serverId?: string;
}

/** Returned once, on creation. `key` is never available again. */
export interface CreatedApiKey extends ApiKeyInfo {
  key: string;
}
