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

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5020/";

export class ApiError extends Error {
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

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = new URL(path, API_BASE).toString();
  // Include stored auth token (when available in browser) and allow callers to override headers
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
    } catch {
      // refresh failed - log out and redirect
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
    return (await res.text()) as unknown as T;
  }
}

// raw fetch for binary/image endpoints and where we must control headers
export async function apiFetchRaw(path: string, options?: RequestInit): Promise<Response> {
  const url = new URL(path, API_BASE).toString();
  // For raw fetches (images/binaries) also include Authorization when available
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
    } catch {
      // refresh failed - log out and redirect
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
export const getConfig = async (): Promise<Server[]> => apiFetch<Server[]>("/Auth/Config");

// Updated per OpenAPI: use /Api/UpdateConfig to add/update a server
export const addServer = async (payload: AddServer): Promise<Server> =>
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

export async function buildQuery(params?: Record<string, any>, gridify?: IGridifyQuery | null): Promise<string> {
  const fromGrid = gridifyToApiParams(gridify ?? null);
  // explicit params should override gridify-derived values
  const merged = { ...fromGrid, ...(params ?? {}) } as Record<string, any>;

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

export const getRecentlyAdded = async (gridify?: IGridifyQuery): Promise<PagingResponse<ItemsWithParentData>> => {
  const path = `/Api/RecentlyAdded${await buildQuery(undefined, gridify)}`;
  return apiFetch<PagingResponse<ItemsWithParentData>>(path);
};

// Minimal typed models for common endpoints (subset of schema)

// Generic list endpoints
export const getTrackedUsers = async (
  params?: {
    ServerId?: string;
  },
  gridify?: IGridifyQuery,
): Promise<PagingResponse<TrackedUsers>> =>
  apiFetch<PagingResponse<TrackedUsers>>(`/Api/TrackedUsers${await buildQuery(params as Record<string, any>, gridify)}`);

export const postTrackedUsers = async (payload: TrackedUsers[]): Promise<TrackedUsers[]> =>
  apiFetch<TrackedUsers[]>("/Api/TrackedUsers", { method: "POST", body: JSON.stringify(payload) });

export const getTrackedLibraries = async (
  params?: {
    ServerId?: string;
  },
  gridify?: IGridifyQuery,
): Promise<PagingResponse<TrackedLibraries>> =>
  apiFetch<PagingResponse<TrackedLibraries>>(`/Api/TrackedLibraries${await buildQuery(params as Record<string, any>, gridify)}`);

export const postTrackedLibraries = async (payload: TrackedLibraries[]): Promise<TrackedLibraries[]> =>
  apiFetch<TrackedLibraries[]>("/Api/TrackedLibraries", { method: "POST", body: JSON.stringify(payload) });

export const getUsers = async (
  params?: {
    ServerId?: string;
  },
  gridify?: IGridifyQuery,
): Promise<PagingResponse<Users>> =>
  apiFetch<PagingResponse<Users>>(`/Api/Users${await buildQuery(params as Record<string, any>, gridify)}`);

export const getLibraries = async (gridify?: IGridifyQuery): Promise<PagingResponse<LibrariesWithStats>> =>
  apiFetch<PagingResponse<LibrariesWithStats>>(`/Api/Libraries${await buildQuery(undefined, gridify)}`);

export const getLibraryItems = async (
  params?: {
    ServerId?: string;
  },
  gridify?: IGridifyQuery,
): Promise<PagingResponse<ItemsWithStats>> =>
  apiFetch<PagingResponse<ItemsWithStats>>(`/Api/LibraryItems${await buildQuery(params as Record<string, any>, gridify)}`);

export const startSync = async (): Promise<boolean> => apiFetch<boolean>("/Api/StartSync");

export const insertActivity = async (serverId: string | undefined, payload: ActivityV1[]): Promise<void> => {
  const headers: Record<string, string> = {};
  if (serverId) headers["ServerId"] = serverId;
  await apiFetch<void>(`/Api/InsertActivity${serverId ? `?ServerId=${encodeURIComponent(serverId)}` : ""}`, {
    method: "POST",
    body: JSON.stringify(payload),
    headers,
  });
};

// Set a local user's default server
export const setLocalUserServer = async (payload: { userId: string; serverId: string }): Promise<void> =>
  apiFetch<void>("/Api/SetLocalUserServer", { method: "POST", body: JSON.stringify(payload) });

// Auth
// Interface/type definitions have been moved to ./models/

export const login = async (payload: LoginModel): Promise<void> => {
  const result = await apiFetch<{ token: string; refreshToken?: string }>("/Auth/Login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (typeof window !== "undefined") {
    try {
      if (result?.token) localStorage.setItem("jellystat_token", result.token);
      if (result?.refreshToken) localStorage.setItem("jellystat_refreshToken", result.refreshToken);
    } catch {
      /* ignore localStorage failures */
    }
  }
};

export const updateUser = async (payload: LocalUser): Promise<void> =>
  apiFetch<void>("/Auth/UpdateUser", { method: "POST", body: JSON.stringify(payload) });

export const createUser = async (payload: LocalUser): Promise<void> =>
  apiFetch<void>("/Auth/CreateUser", { method: "POST", body: JSON.stringify(payload) });

// Refresh auth (no body expected)
export const refreshToken = async (): Promise<void> => {
  const url = new URL("/Auth/Refresh", API_BASE).toString();

  let refresh: string | null = null;
  if (typeof window !== "undefined") {
    try {
      refresh = localStorage.getItem("jellystat_refreshToken");
    } catch {
      /* ignore */
    }
  }

  const headers: Record<string, string> = {};
  if (refresh) headers["Authorization"] = `Bearer ${refresh}`;

  let res: Response;
  try {
    res = await fetch(url, { method: "GET", headers });
  } catch (err) {
    logoutAndRedirect();
    throw err;
  }

  if (!res.ok) {
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
export const getHistoryActivity = async (
  params?: {
    ServerId?: string;
  },
  gridify?: IGridifyQuery,
): Promise<PagingResponse<unknown>> => apiFetch(`/History/Activity${await buildQuery(params as Record<string, any>, gridify)}`);

export const deleteHistoryActivity = async (serverId: string | undefined, ids: string[]): Promise<void> =>
  apiFetch<void>(`/History/Activity${serverId ? `?ServerId=${encodeURIComponent(serverId)}` : ""}`, {
    method: "DELETE",
    body: JSON.stringify(ids),
  });

// Proxy image helpers (return Blob)
export const getProxyDeviceImage = async (serverId?: string, deviceName?: string): Promise<Blob> => {
  const path = `/Proxy/Images/Devices${await buildQuery({ DeviceName: deviceName, ServerId: serverId })}`;
  const res = await apiFetchRaw(path);
  return res.blob();
};

export const getItemBackdrop = async (serverId?: string, id?: string, width = 800, quality = 100, blur = 0): Promise<Blob> => {
  const path = `/Proxy/Images/Items/Backdrop${await buildQuery({ Id: id, Width: width, Quality: quality, Blur: blur, ServerId: serverId })}`;
  const res = await apiFetchRaw(path);
  return res.blob();
};

export const getItemPrimary = async (serverId?: string, id?: string, width = 800, quality = 100, blur = 0): Promise<Blob> => {
  const path = `/Proxy/Images/Items/Primary${await buildQuery({ Id: id, Width: width, Quality: quality, Blur: blur, ServerId: serverId })}`;
  const res = await apiFetchRaw(path);
  return res.blob();
};

export const getUserPrimary = async (serverId?: string, id?: string, width = 800, quality = 100, blur = 0): Promise<Blob> => {
  const path = `/Proxy/Images/User/Primary${await buildQuery({ Id: id, Width: width, Quality: quality, Blur: blur, ServerId: serverId })}`;
  const res = await apiFetchRaw(path);
  return res.blob();
};

// Stats endpoints (common pattern)
export const getItemStats = async (
  params?: {
    ServerId?: string;
    days?: number;
  },
  gridify?: IGridifyQuery,
) => apiFetch<PagingResponse<ItemsWithStats>>(`/Stats/ItemStats${await buildQuery(params as Record<string, any>, gridify)}`);

export const getMostPopularItems = async (
  params?: {
    ServerId?: string;
    days?: number;
  },
  gridify?: IGridifyQuery,
) =>
  apiFetch<PagingResponse<ItemsWithStats>>(`/Stats/MostPopularItems${await buildQuery(params as Record<string, any>, gridify)}`);

export const getLibraryStats = async (
  params?: {
    ServerId?: string;
    days?: number;
  },
  gridify?: IGridifyQuery,
) =>
  apiFetch<PagingResponse<LibrariesWithStats>>(`/Stats/LibraryStats${await buildQuery(params as Record<string, any>, gridify)}`);

export const getMostUsedClients = async (
  params?: {
    ServerId?: string;
    days?: number;
  },
  gridify?: IGridifyQuery,
) => apiFetch<PagingResponse<unknown>>(`/Stats/MostUsedClients${await buildQuery(params as Record<string, any>, gridify)}`);

export const getUserStats = async (
  params?: {
    ServerId?: string;
    days?: number;
  },
  gridify?: IGridifyQuery,
) => apiFetch<PagingResponse<unknown>>(`/Stats/UserStats${await buildQuery(params as Record<string, any>, gridify)}`);

export const getTranscodeStats = async (
  params?: {
    ServerId?: string;
    days?: number;
  },
  gridify?: IGridifyQuery,
) => apiFetch<PagingResponse<unknown>>(`/Stats/TranscodeStats${await buildQuery(params as Record<string, any>, gridify)}`);

export const getMostPopularTranscodes = async (
  params?: {
    ServerId?: string;
    days?: number;
  },
  gridify?: IGridifyQuery,
) => apiFetch<PagingResponse<unknown>>(`/Stats/MostPopularItems${await buildQuery(params as Record<string, any>, gridify)}`);
// Grouped exports by parent path
export const Api = {
  getConfig,
  addServer,
  getRecentlyAdded,
  trackedUsers: { get: getTrackedUsers, post: postTrackedUsers },
  trackedLibraries: { get: getTrackedLibraries, post: postTrackedLibraries },
  users: getUsers,
  libraries: getLibraries,
  libraryItems: getLibraryItems,
  startSync,
  insertActivity,
  setLocalUserServer,
};

export const Stats = {
  itemStats: getItemStats,
  mostPopularItems: getMostPopularItems,
  libraryStats: getLibraryStats,
  mostUsedClients: getMostUsedClients,
  userStats: getUserStats,
  transcodeStats: getTranscodeStats,
  mostPopularTranscodes: getMostPopularTranscodes,
};

export const History = {
  activity: { get: getHistoryActivity, delete: deleteHistoryActivity },
};

export const Auth = {
  login,
  updateUser,
  createUser,
  refreshToken,
};

export const Proxy = {
  images: {
    devices: getProxyDeviceImage,
    items: { backdrop: getItemBackdrop, primary: getItemPrimary },
    user: { primary: getUserPrimary },
  },
};

export default {
  API_BASE,
  apiFetch,
  apiFetchRaw,
  Api,
  Stats,
  History,
  Auth,
  Proxy,
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
  //   startSync,
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
