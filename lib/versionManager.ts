import client from "./api";
import { VersionInfo } from "./models/VersionInfo";

const STORAGE_KEY = "jellystat_version";

let cache: VersionInfo | null = null;

function readStored(): VersionInfo | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as VersionInfo | null;
    if (!parsed) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStored(info: VersionInfo | null) {
  if (typeof window === "undefined") return;
  try {
    if (!info) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
  } catch {
    /* ignore storage errors */
  }
}

async function fetchAndStore(): Promise<VersionInfo> {
  const info = (await client.Api.getVersion()) as VersionInfo;
  cache = info ?? null;
  if (!info) return { apiVersion: "", currentUiTag: "", latestUiTag: "", uiHasUpdate: false };
  writeStored(cache);
  return cache;
}

const versionManger = {
  /**
   * Get the stored config. If refresh===true, force fetch from API.
   * If no stored config exists, will fetch from API and persist it.
   */
  async getInfo(refresh = false): Promise<VersionInfo> {
    if (refresh) {
      return fetchAndStore();
    }

    if (cache) return cache;

    const stored = readStored();
    if (stored) {
      cache = stored;
      return cache;
    }

    // fallback: fetch from API
    return fetchAndStore();
  },

  /** Replace stored config (memory + localStorage) */
  setVersionInfo(info: VersionInfo | null) {
    cache = info ?? null;
    writeStored(cache);
  },

  /** Clear stored config */
  clearVersionInfo() {
    cache = null;
    writeStored(null);
  },
};

export default versionManger;
