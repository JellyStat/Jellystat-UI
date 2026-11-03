import client, { isAnonymousConfig } from "./api";
import type { Server } from "./models/server";
import { TaskSettings } from "./models/taskSettings";

const STORAGE_KEY = "jellystat_config";

let cache: Server[] | null = null;
// Bumped on every clear/set so a fetch that started under a previous session can't write its result back.
let generation = 0;

function hasToken(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return !!localStorage.getItem("jellystat_token");
  } catch {
    return false;
  }
}

function readStored(): Server[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Server[] | null;
    if (!parsed || !Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStored(cfg: Server[] | null) {
  if (typeof window === "undefined") return;
  try {
    if (!cfg) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch {
    /* ignore storage errors */
  }
}

async function fetchAndStore(): Promise<Server[]> {
  const startGeneration = generation;
  const authenticated = hasToken();
  const cfg = ((await client.Auth.getConfig()) as Server[]) ?? [];
  // Anonymous responses omit fields like url/externalURL, so never cache them; and drop results from a
  // fetch that was overtaken by a login/logout while in flight.
  // client.Auth.getConfig already refreshed and retried once, so a list still anonymous here stays uncached.
  if (!authenticated || isAnonymousConfig(cfg) || startGeneration !== generation) return cfg;
  cache = cfg;
  if (cfg.length === 0) return [];
  writeStored(cache);
  return cache;
}

const configManager = {
  /**
   * Get the stored config. If refresh===true, force fetch from API.
   * If no stored config exists, will fetch from API and persist it.
   */
  async getConfig(refresh = false): Promise<Server[]> {
    if (refresh) {
      return await fetchAndStore();
    }

    if (cache && cache.length > 0) return cache;

    const stored = readStored();
    if (stored && stored.length > 0) {
      cache = stored;
      return cache;
    }

    // fallback: fetch from API
    return await fetchAndStore();
  },

  async getTaskSettings(refresh = false): Promise<TaskSettings[]> {
    const cfg = await this.getActiveConfig(refresh);
    return cfg?.taskSettings ?? [];
  },

  async getActiveConfig(refresh = false): Promise<Server | null> {
    const configs = await this.getConfig(refresh);
    if (!configs || configs.length === 0) return null;

    const currentServerId = localStorage.getItem("jellystat_serverId");

    if (!currentServerId) return null;

    const active = configs.find((c) => c.id === currentServerId) ?? null;

    return active;
  },

  /** Replace stored config (memory + localStorage) */
  setConfig(cfg: Server[] | null) {
    generation++;
    cache = cfg ?? null;
    writeStored(cache);
  },

  /** Clear stored config */
  clearConfig() {
    generation++;
    cache = null;
    writeStored(null);
  },
};

export default configManager;
