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
    console.log("Processing server ID. Token present:", !!token, "Provided serverId:", serverId);
    if (!token) return;
    try {
      const payloadBase64 = token.split(".")[1];
      const decoded = JSON.parse(atob(payloadBase64));
      if (decoded && decoded.serverId.length == 0) {
        decoded.serverId = null;
      }

      if (!decoded.serverId && !serverId && permissionsManager.hasPermission(Permissions.Administrator)) {
        const servers = await configManager.getConfig();
        if (servers.length > 0) {
          decoded.serverId = servers[0].id;
        }
      }
      console.log("Decoded token payload:", decoded);
      console.log("Determined server ID to store:", decoded.serverId ?? serverId);
      if (decoded.serverId ?? serverId) {
        localStorage.setItem("jellystat_serverId", decoded.serverId ?? serverId);
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
