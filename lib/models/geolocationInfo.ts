export interface GeolocationInfo {
  ipAddress: string;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  countryCode?: string | null;
  postalCode?: string | null;
  isp?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  accuracyRadiusKm?: number | null;
}
