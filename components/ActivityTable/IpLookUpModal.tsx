import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ExternalLink, MapPin } from "lucide-react";

import client from "@/lib/api";
import type { GeolocationInfo } from "@/lib/models/geolocationInfo";
import { Alert, Button, Modal, ModalFooter, ModalHeader, ModalPanel, Spinner } from "@/components/ui";

type Props = {
  ip: string;
};

type LookupError = { message: string; notConfigured: boolean };

export function IpLookupModal({ ip }: Props) {
  const { t } = useTranslation("common");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<GeolocationInfo | null>(null);
  const [error, setError] = useState<LookupError | null>(null);

  const lookup = async () => {
    setLoading(true);
    setError(null);
    try {
      setInfo(await client.Utils.geolocateIp(ip));
    } catch (err: any) {
      setError({
        message: err?.message ?? String(err),
        notConfigured: err?.status === 501,
      });
    } finally {
      setLoading(false);
    }
  };

  const open = () => {
    setShow(true);
    // Only hit the API once per IP while this row is mounted
    if (!info && !loading) void lookup();
  };

  const hasLocation = info?.latitude != null && info?.longitude != null;
  const mapUrls = (() => {
    if (!hasLocation) return null;
    const lat = info!.latitude!;
    const lon = info!.longitude!;
    // Zoom out roughly in line with GeoLite's accuracy radius
    const d = Math.min(Math.max((info!.accuracyRadiusKm ?? 20) / 111, 0.02), 2);
    return {
      embed: `https://www.openstreetmap.org/export/embed.html?bbox=${lon - d},${lat - d},${lon + d},${lat + d}&layer=mapnik&marker=${lat},${lon}`,
      link: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=11/${lat}/${lon}`,
    };
  })();

  const rows: { label: string; value?: string | null }[] = info
    ? [
        { label: t("ip_lookup.city", "City"), value: info.city },
        { label: t("ip_lookup.region", "Region"), value: info.region },
        {
          label: t("ip_lookup.country", "Country"),
          value: info.country ? `${info.country}${info.countryCode ? ` (${info.countryCode})` : ""}` : null,
        },
        { label: t("ip_lookup.postcode", "Postcode"), value: info.postalCode },
        { label: t("ip_lookup.isp", "ISP"), value: info.isp },
        {
          label: t("ip_lookup.accuracy", "Accuracy"),
          value: info.accuracyRadiusKm != null ? t("ip_lookup.within_km", "Within {{km}} km", { km: info.accuracyRadiusKm }) : null,
        },
      ].filter((r) => r.value)
    : [];

  return (
    <div>
      <button
        type="button"
        onClick={open}
        className="inline-flex items-center gap-1 cursor-pointer hover:text-accent transition-colors underline decoration-dotted decoration-gray-500 underline-offset-4 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
        title={t("ip_lookup.lookup", "Look up location")}
      >
        <MapPin size={12} aria-hidden="true" className="shrink-0" />
        {ip}
      </button>
      <Modal open={show} onClose={() => setShow(false)}>
        <ModalPanel size="lg">
          <ModalHeader
            icon={<MapPin size={22} />}
            iconTone="accent"
            title={<span className="break-all">{t("ip_lookup.title", "Geolocation for {{ip}}", { ip })}</span>}
          />

          {loading && (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-gray-400">
              <Spinner size={32} tone="primary" />
              <span className="text-sm font-medium">{t("common.loading", "Loading")}</span>
            </div>
          )}

          {!loading && error && (
            <Alert
              tone="danger"
              title={
                error.notConfigured
                  ? t("ip_lookup.not_configured", "IP lookup isn't set up")
                  : t("errors.couldn_t_look_up_this_ip_address", "Couldn't look up this IP address")
              }
            >
              <p>
                {error.notConfigured
                  ? t(
                      "ip_lookup.not_configured_desc",
                      "Add a free MaxMind GeoLite account ID and license key to the API as JS_GEOLITE_ACCOUNT_ID and JS_GEOLITE_LICENSE_KEY, then restart it.",
                    )
                  : error.message}
              </p>
              {!error.notConfigured && (
                <Button variant="secondary" size="sm" onClick={() => void lookup()} className="mt-3">
                  {t("common.retry", "Retry")}
                </Button>
              )}
            </Alert>
          )}

          {!loading && !error && info && (
            <div className="flex flex-col gap-4">
              {rows.length > 0 ? (
                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                  {rows.map((r) => (
                    <div key={r.label} className="contents">
                      <dt className="font-bold text-gray-400 uppercase tracking-wider text-xs pt-0.5">{r.label}</dt>
                      <dd className="text-gray-200 break-words">{r.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-gray-400">{t("empty.no_location_details_are_available_for", "No location details are available for this IP.")}</p>
              )}

              {mapUrls && (
                <div className="flex flex-col gap-2">
                  <iframe
                    title={t("ip_lookup.map", "Map")}
                    src={mapUrls.embed}
                    className="w-full h-64 sm:h-80 rounded-xl border border-border bg-background"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  <a
                    href={mapUrls.link}
                    target="_blank"
                    rel="noreferrer"
                    className="self-end inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-accent transition-colors"
                  >
                    {t("ip_lookup.open_map", "Open in OpenStreetMap")} <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          )}

          <ModalFooter className="pt-6">
            <Button variant="secondary" onClick={() => setShow(false)}>
              {t("common.close", "Close")}
            </Button>
          </ModalFooter>
        </ModalPanel>
      </Modal>
    </div>
  );
}
