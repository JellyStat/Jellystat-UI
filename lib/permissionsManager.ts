import { Permissions } from "./models/enums/Permissions";

let cached: string[] | null = null;

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const token = localStorage.getItem("jellystat_token");
    return token;
  } catch {
    return null;
  }
}

function parseJwt(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1];
    // base64 decode (URL-safe)
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(b64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(""),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function extractPermissionsFromPayload(payload: any): string[] {
  if (!payload) return [];
  const value = payload["permissions"];
  const trimmed = value.trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    console.warn("Failed to parse permissions claim as JSON array");
  }

  return [];
}

function readPermissions(): string[] {
  try {
    if (cached) return cached;
    const token = getToken();
    if (!token) return (cached = []);
    const payload = parseJwt(token);
    const perms = extractPermissionsFromPayload(payload);
    return (cached = perms || []);
  } catch (e) {
    console.warn("Failed to read permissions from token", e);
    return [];
  }
}

const permissionsManager = {
  /** Return the list of permissions from token (cached). */
  getPermissions(): string[] {
    return readPermissions();
  },

  /** Clear cached permissions (will be re-read from token on next call). */
  clearCache() {
    cached = null;
  },

  /**
   * Check whether the given permission exists in the token.
   * Accepts a Permissions enum value or a string.
   */
  hasPermission(p: Permissions | string): boolean {
    const name = String(p);
    console.log("hasPermission invoked for", name);
    const list = readPermissions();
    console.log("Checking permission", name, "in", list);
    return list.includes(name);
  },
};

export default permissionsManager;
