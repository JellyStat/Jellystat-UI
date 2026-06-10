import SessionItem from "../models/sessionItem";

const BASE_DEVICE_IMAGE_URL = "";

// audit note: this module is expected to return safe text for use in HTML
function getWebDeviceIcon(browser: string | null | undefined) {
  switch (browser) {
    case "Opera":
    case "Opera TV":
    case "Opera Android":
      return BASE_DEVICE_IMAGE_URL + "opera.svg";
    case "Chrome":
    case "Chrome Android":
      return BASE_DEVICE_IMAGE_URL + "chrome.svg";
    case "Firefox":
    case "Firefox Android":
      return BASE_DEVICE_IMAGE_URL + "firefox.svg";
    case "Safari":
    case "Safari iPad":
    case "Safari iPhone":
      return BASE_DEVICE_IMAGE_URL + "safari.svg";
    case "Edge Chromium":
    case "Edge Chromium Android":
    case "Edge Chromium iPad":
    case "Edge Chromium iPhone":
      return BASE_DEVICE_IMAGE_URL + "edgechromium.svg";
    case "Edge":
      return BASE_DEVICE_IMAGE_URL + "edge.svg";
    case "Internet Explorer":
      return BASE_DEVICE_IMAGE_URL + "msie.svg";
    case "Titan OS":
      return BASE_DEVICE_IMAGE_URL + "titanos.svg";
    case "Vega OS":
      return BASE_DEVICE_IMAGE_URL + "firetv.svg";
    default:
      return BASE_DEVICE_IMAGE_URL + "html5.svg";
  }
}

export function getDeviceIcon(info: SessionItem): string | null {
  switch (info.client) {
    case "Samsung Smart TV":
      return BASE_DEVICE_IMAGE_URL + "samsungtv.svg";
    case "Xbox One":
      return BASE_DEVICE_IMAGE_URL + "xbox.svg";
    case "Sony PS4":
      return BASE_DEVICE_IMAGE_URL + "playstation.svg";
    case "Kodi":
    case "Kodi JellyCon":
      return BASE_DEVICE_IMAGE_URL + "kodi.svg";
    case "Jellyfin Android":
    case "AndroidTV":
    case "Android TV":
    case "Jellyfin Android TV":
    case "Jellyfin for Android":
    case "Jellyfin for Android TV":
      return BASE_DEVICE_IMAGE_URL + "android.svg";
    case "Jellyfin Mobile (iOS)":
    case "Jellyfin Mobile (iPadOS)":
    case "Jellyfin iOS":
    case "Jellyfin iPadOS":
    case "Jellyfin tvOS":
    case "Swiftfin iPadOS":
    case "Swiftfin iOS":
    case "Swiftfin tvOS":
    case "Infuse":
    case "Infuse-Direct":
    case "Infuse-Library":
      return BASE_DEVICE_IMAGE_URL + "apple.svg";
    case "Home Assistant":
      return BASE_DEVICE_IMAGE_URL + "home-assistant.svg";
    case "Jellyfin for WebOS":
    case "LG Smart TV":
      return BASE_DEVICE_IMAGE_URL + "webos.svg";
    case "Jellyfin Roku":
      return BASE_DEVICE_IMAGE_URL + "roku.svg";
    case "Jellyfin for Titan OS":
      return BASE_DEVICE_IMAGE_URL + "titanos.svg";
    case "Finamp":
      return BASE_DEVICE_IMAGE_URL + "finamp.svg";
    case "Jellyfin Web":
      return getWebDeviceIcon(info.deviceName);
    default:
      if (info.deviceIconUrl) {
        return null;
        // try {

        //   return new URL(info.deviceIconUrl).toString();
        // } catch (err) {
        //   console.error("[getDeviceIcon] device capabilities has invalid IconUrl", info, err);
        // }
      }
      return BASE_DEVICE_IMAGE_URL + "other.svg";
  }
}

export default {
  getDeviceIcon,
};
