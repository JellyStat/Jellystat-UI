import configManager from "../configManager";
import Permissions from "../models/enums/Permissions";
import { Token } from "../models/token";
import permissionsManager from "../permissionsManager";

export async function setToken(result: Token, serverId?: string): Promise<boolean> {
  if (typeof window !== "undefined") {
    try {
      if (!result?.token) {
        return false;
      }
      localStorage.setItem("jellystat_token", result.token);
      permissionsManager.clearCache();
      await processServerId(serverId);

      if (result?.refreshToken) localStorage.setItem("jellystat_refreshToken", result.refreshToken);
    } catch {
      return false;
    } finally {
      return true;
    }
  } else {
    console.warn("Window is undefined, skipping localStorage operations");
    return false;
  }
}

export async function processServerId(serverId?: string) {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("jellystat_token");
    if (!token) return;
    try {
      const payloadBase64 = token.split(".")[1];
      const decoded = JSON.parse(atob(payloadBase64));
      let selectedServerId: string | null = decoded?.serverId || serverId || null;
      const isAdmin = permissionsManager.hasPermission(Permissions.Administrator);
      if (selectedServerId == null && isAdmin) {
        const servers = await configManager.getConfig(true);
        if (servers.length > 0) {
          selectedServerId = servers[0].id;
        }
      }
      if (selectedServerId) {
        localStorage.setItem("jellystat_serverId", selectedServerId);
      }
    } catch {
      console.warn("Failed to decode token payload, server selection may not persist across sessions");
      configManager.clearConfig();
    }
  } else {
    console.warn("Window is undefined, skipping localStorage operations");
    return;
  }
}
