import client from "./api";
import type { Server } from "./models/server";
import { TaskSettings } from "./models/taskSettings";

const STORAGE_KEY = "jellystat_config";

let cache: Server[] | null = null;

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
  const cfg = (await client.Auth.getConfig()) as Server[];
  cache = cfg ?? [];
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
      return fetchAndStore();
    }

    if (cache && cache.length > 0) return cache;

    const stored = readStored();
    if (stored && stored.length > 0) {
      cache = stored;
      return cache;
    }

    // fallback: fetch from API
    return fetchAndStore();
  },

  async getTaskSettings(): Promise<TaskSettings[]> {
    const cfg = await this.getActiveConfig();
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
    cache = cfg ?? null;
    writeStored(cache);
  },

  /** Clear stored config */
  clearConfig() {
    cache = null;
    writeStored(null);
  },
};

export default configManager;
