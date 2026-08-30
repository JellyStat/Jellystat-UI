import type { IGridifyQuery } from "gridify-client";
import type { Server } from "./models/server";
import type { AddServer } from "./models/addServer";
import type { PagingResponse } from "./models/pagingResponse";
import type { TrackedUsers } from "./models/trackedUsers";
import type { TrackedLibraries } from "./models/trackedLibraries";
import type { Users } from "./models/users";
import type { LibrariesWithStats } from "./models/librariesWithStats";
import type { ItemsWithStats } from "./models/itemsWithStats";
import type { ActivityV1 } from "./models/activityV1";
import type { LoginModel } from "./models/loginModel";
import type { LocalUser } from "./models/localUser";
import ItemsWithParentData from "./models/itemsWithParentData";
import { SystemInfo } from "./models/systemInfo";
import Activity from "./models/activity";
import { MostUsedClients } from "./models/mostUsedClients";
import { UserStats } from "./models/userStats";
import { TranscodeStats } from "./models/transcodeStats";
import { MigrateActivity } from "./models/MigrateActivity";
import { Token } from "./models/token";
import { ChartStats } from "./models/chartStats";
import StatMetric from "./models/enums/statMetric";
import { GenreStats } from "./models/genreStats";
import { CountModel } from "./models/countModel";
import { TaskSettings } from "./models/taskSettings";
import { Tasks as TaskTypes } from "./models/enums/Tasks";
import { LogsModel } from "./models/LogsModel";
import { RecentlyAdded } from "./models/RecentlyAdded";
import { CountModelWithSize } from "./models/countModelWithSize";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

class ApiError extends Error {
  status: number;
  statusText: string;
  raw?: string;

  constructor(message: string, status: number, statusText: string, raw?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
    this.raw = raw;
  }
}

function getServerId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("jellystat_serverId");
  } catch {
    return null;
  }
}

function logoutAndRedirect(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("jellystat_token");
    localStorage.removeItem("jellystat_refreshToken");
  } catch {
    /* ignore localStorage errors */
  }
  try {
    window.location.href = "/login";
  } catch {
    /* ignore */
  }
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  // Include stored auth token (when available in browser) and allow callers to override headers
  const url = API_BASE + path;
  let authHeader: string | undefined;
  if (typeof window !== "undefined") {
    try {
      const t = localStorage.getItem("jellystat_token");
      if (t) authHeader = `Bearer ${t}`;
    } catch {
      /* ignore localStorage errors */
    }
  }

  const mergedHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(authHeader ? { Authorization: authHeader } : {}),
    ...(options && (options.headers as Record<string, string>)),
  };

  let res = await fetch(url, { ...options, headers: mergedHeaders });

  // If unauthorized and we had a token, attempt one refresh+retry using the long-lived refresh token
  if (res.status === 401 && path !== "/Auth/Refresh" && path !== "/Auth/Login") {
    if (!authHeader) {
      // No auth header, so this is likely a public endpoint that doesn't require auth. Don't attempt refresh.
      logoutAndRedirect();
    }
    try {
      await refreshToken();
      // re-read token and retry once
      let newAuth: string | undefined;
      if (typeof window !== "undefined") {
        try {
          const t = localStorage.getItem("jellystat_token");
          if (t) newAuth = `Bearer ${t}`;
        } catch {}
      }
      const retryHeaders = { ...mergedHeaders } as Record<string, string>;
      if (newAuth) retryHeaders["Authorization"] = newAuth;
      else delete retryHeaders["Authorization"];
      res = await fetch(url, { ...options, headers: retryHeaders });
    } catch (er) {
      // refresh failed - log out and redirect
      console.error("Token refresh failed during apiFetch retry:", er);
      logoutAndRedirect();
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let userMessage = "";
    try {
      const parsed = JSON.parse(text || "null");
      if (parsed && (parsed.message || parsed.error)) userMessage = parsed.message ?? parsed.error;
      else if (typeof parsed === "string") userMessage = parsed;
    } catch {
      // text wasn't JSON
    }
    if (!userMessage) userMessage = text || `${res.status} ${res.statusText}`;
    throw new ApiError(userMessage, res.status, res.statusText, text);
  }

  if (res.status === 204) return undefined as unknown as T;

  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json") || ct.includes("text/json")) return res.json() as Promise<T>;

  try {
    return (await res.json()) as T;
  } catch {
    try {
      console.log("Response was not JSON, returning as text: ", await res.text());
      return (await res.text()) as unknown as T;
    } catch {
      console.log("Unable to parse response as JSON or text, returning empty object as fallback");
      return {} as T;
    }
  }
}

// raw fetch for binary/image endpoints and where we must control headers
async function apiFetchRaw(path: string, options?: RequestInit): Promise<Response> {
  // For raw fetches (images/binaries) also include Authorization when available
  const url = API_BASE + path;
  let authHeader: string | undefined;
  if (typeof window !== "undefined") {
    try {
      const t = localStorage.getItem("jellystat_token");
      if (t) authHeader = `Bearer ${t}`;
    } catch {
      /* ignore */
    }
  }

  const mergedHeaders: Record<string, string> = {
    ...(options && (options.headers as Record<string, string>)),
    ...(authHeader ? { Authorization: authHeader } : {}),
  };

  let res = await fetch(url, { ...options, headers: mergedHeaders });

  // If unauthorized and we had a token, attempt one refresh+retry using the long-lived refresh token
  if (res.status === 401 && authHeader) {
    try {
      await refreshToken();
      // re-read token and retry once
      let newAuth: string | undefined;
      if (typeof window !== "undefined") {
        try {
          const t = localStorage.getItem("jellystat_token");
          if (t) newAuth = `Bearer ${t}`;
        } catch {}
      }
      const retryHeaders = { ...mergedHeaders } as Record<string, string>;
      if (newAuth) retryHeaders["Authorization"] = newAuth;
      else delete retryHeaders["Authorization"];
      res = await fetch(url, { ...options, headers: retryHeaders });
    } catch (er) {
      // refresh failed - log out and redirect
      console.error("Token refresh failed during apiFetchRaw retry:", er);
      logoutAndRedirect();
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let userMessage = "";
    try {
      const parsed = JSON.parse(text || "null");
      if (parsed && (parsed.message || parsed.error)) userMessage = parsed.message ?? parsed.error;
      else if (typeof parsed === "string") userMessage = parsed;
    } catch {
      // text wasn't JSON
    }
    if (!userMessage) userMessage = text || `${res.status} ${res.statusText}`;
    throw new ApiError(userMessage, res.status, res.statusText, text);
  }
  return res;
}

// Model interfaces moved to individual files under ./models/

// Updated per OpenAPI: server list is returned from Auth/Config
const getConfig = async (): Promise<Server[]> => apiFetch<Server[]>("/Auth/Config");

// Updated per OpenAPI: use /Api/UpdateConfig to add/update a server
const addServer = async (payload: AddServer): Promise<Server> =>
  apiFetch<Server>("/Api/UpdateConfig", { method: "POST", body: JSON.stringify(payload) });

// Convert an IGridifyQuery into API query params using the server's expected keys
function gridifyToApiParams(grid?: IGridifyQuery | null): Record<string, any> {
  if (!grid) return {};
  const out: Record<string, any> = {};
  const g: any = grid as any;

  if (g.page != null) out.Page = g.page;
  if (g.pageSize != null) out.PageSize = g.pageSize;

  const order = g.orderBy ?? g.order;
  if (order != null) {
    if (Array.isArray(order)) out.OrderBy = order.map((o: any) => (typeof o === "string" ? o : o.field || String(o))).join(",");
    else out.OrderBy = String(order);
  }

  if (g.filter != null) out.Filter = g.filter;
  return out;
}

async function buildQuery(gridify?: IGridifyQuery | null, params?: Record<string, any>): Promise<string> {
  const fromGrid = gridifyToApiParams(gridify ?? null);
  // explicit params should override gridify-derived values
  const merged = { ...fromGrid, ...(params ?? {}) } as Record<string, any>;

  // If no ServerId was provided explicitly, try to pick it up from localStorage (browser only).
  // This allows callers to omit ServerId and rely on the user's selected server stored in localStorage.
  if (merged.ServerId == null || merged.ServerId === "") {
    try {
      const ServerId = getServerId();
      if (ServerId) merged.ServerId = ServerId;
    } catch {
      /* ignore localStorage errors */
    }
  }

  if (Object.keys(merged).length === 0) return "";

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v == null) continue;
    if (Array.isArray(v)) for (const it of v) qs.append(k, String(it));
    else qs.set(k, String(v));
  }

  const out = qs.toString();
  return out ? `?${out}` : "";
}

const getRecentlyAdded = async (gridify?: IGridifyQuery, grouped?: boolean): Promise<PagingResponse<RecentlyAdded>> => {
  const path = `/Api/RecentlyAdded${await buildQuery(gridify, { Grouped: grouped })}`;
  return apiFetch<PagingResponse<RecentlyAdded>>(path);
};

// Minimal typed models for common endpoints (subset of schema)

// Generic list endpoints
const getTrackedUsers = async (gridify?: IGridifyQuery): Promise<PagingResponse<TrackedUsers>> =>
  apiFetch<PagingResponse<TrackedUsers>>(`/Api/TrackedUsers${await buildQuery(gridify)}`);

const postTrackedUsers = (payload: TrackedUsers[]): Promise<Response> =>
  apiFetch("/Api/TrackedUsers", { method: "POST", body: JSON.stringify(payload) });

const getTrackedLibraries = async (gridify?: IGridifyQuery): Promise<PagingResponse<TrackedLibraries>> =>
  apiFetch<PagingResponse<TrackedLibraries>>(`/Api/TrackedLibraries${await buildQuery(gridify)}`);

const postTrackedLibraries = async (payload: TrackedLibraries[]): Promise<TrackedLibraries[]> =>
  apiFetch<TrackedLibraries[]>("/Api/TrackedLibraries", { method: "POST", body: JSON.stringify(payload) });

const getUsers = async (gridify?: IGridifyQuery): Promise<PagingResponse<Users>> =>
  apiFetch<PagingResponse<Users>>(`/Api/Users${await buildQuery(gridify)}`);

const getLocalUsers = async (gridify?: IGridifyQuery): Promise<PagingResponse<Users>> =>
  apiFetch<PagingResponse<Users>>(`/Api/LocalUsers${await buildQuery(gridify)}`);

const getLibraries = async (gridify?: IGridifyQuery): Promise<PagingResponse<LibrariesWithStats>> =>
  apiFetch<PagingResponse<LibrariesWithStats>>(`/Api/Libraries${await buildQuery(gridify)}`);

const getLibraryItems = async (gridify?: IGridifyQuery): Promise<PagingResponse<ItemsWithStats>> =>
  apiFetch<PagingResponse<ItemsWithStats>>(`/Api/LibraryItems${await buildQuery(gridify)}`);

const getMatchingItems = async (name?: string, gridify?: IGridifyQuery): Promise<PagingResponse<ItemsWithParentData>> =>
  apiFetch<PagingResponse<ItemsWithParentData>>(`/Api/MatchingItems${await buildQuery(gridify, { Name: name })}`);

// const insertActivity = async (payload: ActivityV1[], serverId?: string): Promise<void> => {
//   const path = `/Api/InsertActivity${await buildQuery(undefined, { ServerId: serverId })}`;
//   await apiFetch<void>(path, { method: "POST", body: JSON.stringify(payload) });
// };

// Set a local user's default server
const setLocalUserServer = (payload: { userId: string; serverId: string }): Promise<void> =>
  apiFetch<void>("/Api/SetLocalUserServer", { method: "POST", body: JSON.stringify(payload) });

const toggleAllowRemoteAuth = async (serverId?: string): Promise<Boolean> =>
  apiFetch<Boolean>(`/Api/AllowRemoteAuth${await buildQuery(undefined, { ServerId: serverId })}`);

const getTaskLogs = async (gridify?: IGridifyQuery): Promise<PagingResponse<LogsModel>> =>
  apiFetch<PagingResponse<LogsModel>>(`/Api/Logs${await buildQuery(gridify)}`);

// Auth
// Interface/type definitions have been moved to ./models/

const login = (payload: LoginModel): Promise<Token> =>
  apiFetch<Token>("/Auth/Login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

const updateUser = (payload: LocalUser): Promise<void> =>
  apiFetch<void>("/Auth/UpdateUser", { method: "POST", body: JSON.stringify(payload) });

const createUser = (payload: LocalUser): Promise<void> =>
  apiFetch<void>("/Auth/CreateUser", { method: "POST", body: JSON.stringify(payload) });

// Refresh auth (no body expected)
const refreshToken = async (): Promise<void> => {
  console.log("Attempting token refresh");
  const path = "/Auth/Refresh";
  const url = API_BASE + path;

  let refresh: string | null = null;
  if (typeof window !== "undefined") {
    try {
      refresh = localStorage.getItem("jellystat_refreshToken");
    } catch {
      /* ignore */
    }
  }

  console.log("Using refresh token:", refresh ? "Yes" : "No");

  const headers: Record<string, string> = {};
  if (refresh) headers["Authorization"] = `Bearer ${refresh}`;

  let res: Response;
  try {
    res = await fetch(url, { method: "GET", headers });
  } catch (err) {
    console.error("Refresh token request failed:", err);
    logoutAndRedirect();
    throw err;
  }

  if (!res.ok) {
    console.error("Refresh token request failed with status:", res.status, res.statusText);
    const text = await res.text().catch(() => "");
    logoutAndRedirect();
    throw new ApiError(text || `${res.status} ${res.statusText}`, res.status, res.statusText, text);
  }

  // If the refresh endpoint returns a new token pair, store them
  try {
    const parsed = await res.json().catch(() => null);
    if (parsed && typeof window !== "undefined") {
      try {
        if (parsed.token) localStorage.setItem("jellystat_token", parsed.token);
        if (parsed.refreshToken) localStorage.setItem("jellystat_refreshToken", parsed.refreshToken);
      } catch {
        /* ignore localStorage failures */
      }
    }
  } catch {
    /* ignore json parse errors */
  }
};

// History
const getHistoryActivity = async (
  gridify?: IGridifyQuery,
  params?: { GroupResults?: boolean },
): Promise<PagingResponse<Activity>> =>
  apiFetch<PagingResponse<Activity>>(`/History/Activity${await buildQuery(gridify, params as Record<string, any>)}`);

const deleteHistoryActivity = async (serverId: string | undefined, ids: string[]): Promise<void> =>
  apiFetch<void>(`/History/Activity${await buildQuery(undefined, { ServerId: serverId })}`, {
    method: "DELETE",
    body: JSON.stringify(ids),
  });

const getUnlinkedActivity = async (gridify?: IGridifyQuery): Promise<PagingResponse<Activity>> =>
  apiFetch<PagingResponse<Activity>>(`/History/UnlinkedActivity${await buildQuery(gridify)}`);

const migrateActivity = async (payload: MigrateActivity[]): Promise<MigrateActivity[]> =>
  apiFetch<MigrateActivity[]>("/History/MigrateActivity", { method: "POST", body: JSON.stringify(payload) });

// Proxy image helpers (return Blob)
const getProxyDeviceImage = async (serverId?: string, deviceName?: string): Promise<Blob> => {
  const path = `/Proxy/Images/Devices${await buildQuery(undefined, { DeviceName: deviceName, ServerId: serverId })}`;
  const res = await apiFetchRaw(path);
  return res.blob();
};

const getItemBackdrop = async (serverId?: string, id?: string, width = 800, quality = 100, blur = 0): Promise<Blob> => {
  const path = `/Proxy/Images/Items/Backdrop${await buildQuery(undefined, { Id: id, Width: width, Quality: quality, Blur: blur, ServerId: serverId })}`;
  const res = await apiFetchRaw(path);
  return res.blob();
};

const getItemPrimary = async (serverId?: string, id?: string, width = 800, quality = 100, blur = 0): Promise<Blob> => {
  const path = `/Proxy/Images/Items/Primary${await buildQuery(undefined, { Id: id, Width: width, Quality: quality, Blur: blur, ServerId: serverId })}`;
  const res = await apiFetchRaw(path);
  return res.blob();
};

const getUserPrimary = async (serverId?: string, id?: string, width = 800, quality = 100, blur = 0): Promise<Blob> => {
  const path = `/Proxy/Images/User/Primary${await buildQuery(undefined, { Id: id, Width: width, Quality: quality, Blur: blur, ServerId: serverId })}`;
  const res = await apiFetchRaw(path);
  return res.blob();
};

// Stats endpoints (common pattern)
const getItemStats = async (
  params?: {
    days?: number;
  },
  gridify?: IGridifyQuery,
) => apiFetch<PagingResponse<ItemsWithStats>>(`/Stats/ItemStats${await buildQuery(gridify, params as Record<string, any>)}`);

const getMostPopularItems = async (
  params?: {
    days?: number;
  },
  gridify?: IGridifyQuery,
) =>
  apiFetch<PagingResponse<ItemsWithStats>>(`/Stats/MostPopularItems${await buildQuery(gridify, params as Record<string, any>)}`);

const getLibraryStats = async (
  params?: {
    days?: number;
  },
  gridify?: IGridifyQuery,
) =>
  apiFetch<PagingResponse<LibrariesWithStats>>(`/Stats/LibraryStats${await buildQuery(gridify, params as Record<string, any>)}`);

const getMostUsedClients = async (
  params?: {
    days?: number;
  },
  gridify?: IGridifyQuery,
) =>
  apiFetch<PagingResponse<MostUsedClients>>(`/Stats/MostUsedClients${await buildQuery(gridify, params as Record<string, any>)}`);

const getUserStats = async (
  params?: {
    days?: number;
  },
  gridify?: IGridifyQuery,
) => apiFetch<PagingResponse<UserStats>>(`/Stats/UserStats${await buildQuery(gridify, params as Record<string, any>)}`);

const getTranscodeStats = async (
  params?: {
    days?: number;
  },
  gridify?: IGridifyQuery,
) => apiFetch<PagingResponse<TranscodeStats>>(`/Stats/TranscodeStats${await buildQuery(gridify, params as Record<string, any>)}`);

const getStatTrends = async (params?: { days?: number; metric?: StatMetric }) =>
  apiFetch<ChartStats[]>(`/Stats/StatTrends${await buildQuery(undefined, params as Record<string, any>)}`);

const getGenreStats = async (gridify?: IGridifyQuery) => apiFetch<GenreStats[]>(`/Stats/GenreStats${await buildQuery(gridify)}`);

const getCodecStats = async (gridify?: IGridifyQuery) =>
  apiFetch<CountModelWithSize[]>(`/Stats/CodecStats${await buildQuery(gridify)}`);

const getResolutionStats = async (gridify?: IGridifyQuery) =>
  apiFetch<CountModelWithSize[]>(`/Stats/ResolutionStats${await buildQuery(gridify)}`);

// History
const getSystemInfo = async (): Promise<SystemInfo> => apiFetch(`/System/Info`);

//Tasks
const startTask = async (task: TaskTypes) =>
  apiFetchRaw(`/Tasks/StartTask${await buildQuery(undefined, { task })}`)
    .then(() => true)
    .catch(() => false);

const updateTask = async (payload: TaskSettings): Promise<boolean> =>
  apiFetch<boolean>(`/Tasks/UpdateTask${await buildQuery()}`, { method: "POST", body: JSON.stringify(payload) });

// Grouped exports by parent path
export const Api = {
  addServer,
  getRecentlyAdded,
  trackedUsers: { get: getTrackedUsers, post: postTrackedUsers },
  trackedLibraries: { get: getTrackedLibraries, post: postTrackedLibraries },
  getUsers,
  getLocalUsers,
  getLibraries,
  getLibraryItems,
  getMatchingItems,
  // insertActivity,
  setLocalUserServer,
  toggleAllowRemoteAuth,
  getTaskLogs,
};

export const Stats = {
  getItemStats,
  getMostPopularItems,
  getLibraryStats,
  getMostUsedClients,
  getUserStats,
  getTranscodeStats,
  getStatTrends,
  getGenreStats,
  getCodecStats,
  getResolutionStats,
};

export const History = {
  activity: { get: getHistoryActivity, delete: deleteHistoryActivity },
  getUnlinkedActivity,
  migrateActivity,
};

export const Auth = {
  login,
  getConfig,
  updateUser,
  createUser,
  refreshToken,
};

export const Proxy = {
  devices: getProxyDeviceImage,
  items: { getItemBackdrop, getItemPrimary },
  user: { getUserPrimary },
};

export const System = {
  getSystemInfo,
};

export const Tasks = {
  startTask,
  updateTask,
};

export default {
  API_BASE,
  getServerId,
  // apiFetch,
  // apiFetchRaw,
  Api,
  Stats,
  History,
  Auth,
  Proxy,
  System,
  Tasks,
  ApiError,
  // keep individual exports for backward compatibility
  //   getConfig,
  //   addServer,
  //   getRecentlyAdded,
  //   getTrackedUsers,
  //   postTrackedUsers,
  //   getTrackedLibraries,
  //   postTrackedLibraries,
  //   getUsers,
  //   getLibraries,
  //   getLibraryItems,
  //   insertActivity,
  //   login,
  //   updateUser,
  //   createUser,
  //   getHistoryActivity,
  //   deleteHistoryActivity,
  //   getProxyDeviceImage,
  //   getItemBackdrop,
  //   getItemPrimary,
  //   getUserPrimary,
  //   getItemStats,
  //   getMostPopularItems,
  //   getLibraryStats,
  //   getMostUsedClients,
  //   getUserStats,
  //   getTranscodeStats,
};
