import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, ExternalLink, Loader2, MapPin } from "lucide-react";

import client from "@/lib/api";
import type { GeolocationInfo } from "@/lib/models/geolocationInfo";

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
        className="cursor-pointer hover:text-brand-cyan transition-colors focus:outline-none"
        title={t("ip_lookup.lookup", "Look up location")}
      >
        {ip}
      </button>
      <Dialog open={show} onClose={() => setShow(false)} className="relative z-50 focus:outline-none">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center-safe justify-center p-3 sm:p-4 overflow-y-auto">
          <DialogPanel
            transition
            className="w-full max-w-2xl rounded-2xl border border-border bg-surface p-5 shadow-2xl shadow-black/40 duration-100 ease-out data-closed:transform-[scale(95%)] data-closed:opacity-0"
          >
            <DialogTitle className="flex items-center gap-3 mb-5 text-xl sm:text-2xl font-black text-white tracking-tight">
              <MapPin size={22} className="text-brand-cyan shrink-0" />
              <span className="min-w-0 break-all">
                {t("ip_lookup.title", "Geolocation for {{ip}}", { ip })}
              </span>
            </DialogTitle>

            {loading && (
              <div className="py-16 flex flex-col items-center justify-center text-gray-400">
                <Loader2 size={32} className="animate-spin text-brand-cyan mb-3" />
                <span className="text-sm font-medium">{t("common.loading", "Loading")}</span>
              </div>
            )}

            {!loading && error && (
              <div className="p-5 rounded-xl bg-brand-rose/10 border border-brand-rose/20 flex items-start gap-3">
                <AlertCircle size={20} className="text-brand-rose shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-bold text-brand-rose mb-1">
                    {error.notConfigured
                      ? t("ip_lookup.not_configured", "IP lookup isn't set up")
                      : t("ip_lookup.failed", "Couldn't look up this IP address")}
                  </p>
                  <p className="text-gray-400">
                    {error.notConfigured
                      ? t(
                          "ip_lookup.not_configured_desc",
                          "Add a free MaxMind GeoLite account ID and license key to the API as JS_GEOLITE_ACCOUNT_ID and JS_GEOLITE_LICENSE_KEY, then restart it.",
                        )
                      : error.message}
                  </p>
                  {!error.notConfigured && (
                    <button
                      type="button"
                      onClick={() => void lookup()}
                      className="mt-3 px-3 py-1.5 rounded-lg bg-background border border-border text-xs font-bold text-gray-200 hover:text-white hover:border-gray-500 transition-all cursor-pointer"
                    >
                      {t("common.retry", "Retry")}
                    </button>
                  )}
                </div>
              </div>
            )}

            {!loading && !error && info && (
              <div className="flex flex-col gap-4">
                {rows.length > 0 ? (
                  <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                    {rows.map((r) => (
                      <div key={r.label} className="contents">
                        <dt className="font-bold text-gray-500 uppercase tracking-wider text-[11px] pt-0.5">{r.label}</dt>
                        <dd className="text-gray-200 break-words">{r.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="text-sm text-gray-400">{t("ip_lookup.no_details", "No location details are available for this IP.")}</p>
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
                      className="self-end inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-brand-cyan transition-colors"
                    >
                      {t("ip_lookup.open_map", "Open in OpenStreetMap")} <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShow(false)}
                className="px-4 py-2 rounded-lg bg-background border border-border text-gray-200 hover:text-white hover:border-gray-500 transition-all cursor-pointer"
              >
                {t("common.close", "Close")}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
