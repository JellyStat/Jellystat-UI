import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { Film, AlertTriangle, X, MonitorPlay, CheckCircle2, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import Activity from "@/lib/models/activity";
import { BaseTranscodingInfo } from "@/lib/models/baseTranscodingInfo";
import { BaseMediaStream } from "@/lib/models/baseMediaStream";
import "@/types/global-extensions";

type Props = {
  activity: Activity | null;
  open: boolean;
  onClose: () => void;
};

// --- helpers ---

export {};

function playMethodBadge(method: string, ti?: BaseTranscodingInfo, isVideo = true, t?: any): React.ReactNode {
  if (!t) return null;
  const isDirect = isVideo ? (ti?.isVideoDirect ?? true) : (ti?.isAudioDirect ?? true);
  if (method === "DirectStream") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-500/15 text-sky-400 border border-sky-500/30">
        <ArrowRight size={11} /> {t("stream.direct_stream", "Direct Stream")}
      </span>
    );
  }
  if (isDirect) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider text-brand-cyan bg-brand-cyan/15 border border-brand-cyan/30">
        <CheckCircle2 size={11} /> {t("common.direct", "Direct")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider text-brand-amber bg-brand-amber/15 border border-brand-amber/30">
      <AlertTriangle size={11} /> {t("common.transcode", "Transcode")}
    </span>
  );
}

// --- row helper ---

function DataRow({
  label,
  current,
  source,
}: {
  label: string;
  current: string | React.ReactNode;
  source: string | React.ReactNode;
}) {
  const isSame = typeof current === 'string' && typeof source === 'string' && current === source;
  const valueClass = isSame ? 'text-gray-500' : 'text-white';
  return (
    <tr>
      <td className="py-2 pr-3 sm:pr-5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20 sm:w-24 shrink-0">
        {label}
      </td>
      <td
        className={`py-2 pr-3 sm:pr-5 font-mono text-xs sm:text-sm tabular-nums leading-tight w-[110px] sm:w-[180px] ${valueClass}`}
      >
        {current}
      </td>
      <td
        className={`py-2 pr-3 sm:pr-5 font-mono text-xs sm:text-sm tabular-nums leading-tight w-[110px] sm:w-[180px] shrink-0 ${valueClass}`}
      >
        {source}
      </td>
    </tr>
  );
}

// --- section divider ---

function SectionHeader({ title, badge }: { title: string; badge?: React.ReactNode }) {
  return (
    <tr>
      <td className="py-1.5 pr-3 sm:pr-5 text-xs font-black uppercase tracking-wider sm:tracking-[0.15em] text-brand-purple sm:whitespace-nowrap">
        {title}
      </td>
      <td colSpan={2} className="py-1.5">
        {badge && <div className="flex items-center gap-1.5">{badge}</div>}
      </td>
    </tr>
  );
}

// --- main component ---

export function StreamInfoModal({ activity, open, onClose }: Props) {
  const { t } = useTranslation("common");
  const [visible, setVisible] = useState(open);

  // Keep local state in sync when prop changes
  if (open && !visible) setVisible(true);
  if (!open && visible) setVisible(false);

  if (!activity) return null;

  const UNKNOWN = "-";
  const ti = activity.transcodingInfo as BaseTranscodingInfo | undefined;

  const videoStream = activity.mediaStreams?.find((s) => s.type === "Video") ?? null;
  const audioStream = activity.mediaStreams?.find((s) => s.type === "Audio") ?? null;

  // --- computed values ---
  let obRaw = 0;
  if (videoStream?.bitRate) obRaw += videoStream.bitRate;
  if (audioStream?.bitRate) obRaw += audioStream.bitRate;
  const origBitrate = obRaw?.formatBitrate() ?? "-";

  let tbRaw = 0;
  if (ti) {
    if ((ti.isVideoDirect === false && ti.bitrate) || (ti.isAudioDirect === false && ti.bitrate)) {
      tbRaw += ti.isVideoDirect === false ? ti.bitrate! : (videoStream?.bitRate ?? 0);
      tbRaw += ti.isAudioDirect === false ? ti.bitrate! : (audioStream?.bitRate ?? 0);
    } else {
      tbRaw = ti.bitrate ?? obRaw;
    }
  } else {
    tbRaw = obRaw;
  }
  const playMethod = activity.playMethod || "DirectPlay";

  const transcodeBitrate = tbRaw?.formatBitrate() ?? "-";

  let vBitrate = UNKNOWN;
  if (ti?.isVideoDirect === false && ti.bitrate !== undefined) vBitrate = ti.bitrate?.formatBitrate() ?? "-";
  else if (videoStream) vBitrate = videoStream.bitRate?.formatBitrate() ?? "-";

  const langVal = (audioStream?.displayTitle?.toUpperCase() ?? audioStream?.codec?.toUpperCase()) || UNKNOWN;

  return (
    <Dialog
      open={visible}
      onClose={() => {
        setVisible(false);
        setTimeout(onClose, 150);
      }}
      className="relative z-50"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" aria-hidden="true" />

      {/* Panel */}
      <div className="fixed inset-0 flex items-center-safe justify-center p-4 pointer-events-none overflow-y-auto">
        <DialogPanel
          transition
          className="pointer-events-auto relative w-full min-w-0 max-w-3xl my-4 sm:my-8 rounded-2xl border border-border bg-surface shadow-2xl shadow-black/50 duration-100 ease-out data-closed:scale-[95%] data-closed:opacity-0"
        >
          {/* ---- HEADER ---- */}
          <div className="flex items-start justify-between border-b border-border px-4 sm:px-6 pt-5 pb-4 pr-12 sm:pr-14">
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg font-black text-white truncate">
                {activity.seriesName ? `${activity.seriesName}: ${activity.fullName}` : activity.fullName || activity.name || ""}
              </DialogTitle>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {/* User chip */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-background/80 border border-border text-xs font-bold text-gray-300">
                  <Film size={11} className="text-brand-cyan" /> {activity.userName || activity.userId || ""}
                </span>
                {/* Client chip */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-background/80 border border-border text-xs font-bold text-gray-300">
                  {activity.client}
                </span>
                {/* Device chip */}
                {activity.device && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-background/80 border border-border text-xs font-bold text-gray-300">
                    {activity.device}
                  </span>
                )}
                {/* Play method badge on right */}
                <span className="ml-auto">{playMethodBadge(playMethod, ti, undefined, t)}</span>
              </div>
            </div>
            <button
              onClick={() => {
                setVisible(false);
                setTimeout(onClose, 150);
              }}
              className="absolute top-4 right-4 rounded-lg p-2 text-gray-500 hover:bg-surface-hover hover:text-white transition-colors shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* ---- TABLE ---- */}
          <div className="px-4 sm:px-6 py-3 overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              {/* Column headers */}
              <thead>
                <tr className="text-xs font-black text-gray-600 uppercase tracking-widest ">
                  <th className="py-2 pr-3 sm:pr-5 w-20 sm:w-24 shrink-0"></th>
                  <th className="py-2 pr-5 text-brand-purple text-left min-w-[100px] sm:min-w-[280px] align-middle">
                    {t("common.playback_stream", "Playback Stream")}
                  </th>
                  <th className="py-2 pr-5 text-gray-400 text-left w-[110px] sm:w-[180px] shrink-0 align-middle">
                    {t("common.source", "Source")}
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {/* Media header */}
                <SectionHeader title={t("stream.media", "Media")} />

                {/* Bitrate */}
                <DataRow label={t("stream.bitrate", "Bitrate")} current={<>{transcodeBitrate}</>} source={<>{origBitrate}</>} />

                {/* Container */}
                <DataRow
                  label={t("common.container", "Container")}
                  current={(ti?.container ?? activity.container)?.toUpperCase() || UNKNOWN}
                  source={activity.container?.toUpperCase() || UNKNOWN}
                />

                {/* Video section */}
                <SectionHeader title={t("common.video", "Video")} badge={playMethodBadge(playMethod, ti, true, t)} />

                {/* Codec */}
                <DataRow
                  label={t("stream.codec", "Codec")}
                  current={(ti?.videoCodec ?? videoStream?.codec)?.toUpperCase() || UNKNOWN}
                  source={videoStream?.codec?.toUpperCase() || UNKNOWN}
                />

                {/* Video Bitrate */}
                <DataRow
                  label={t("stream.bitrate", "Bitrate")}
                  current={<>{vBitrate}</>}
                  source={<>{videoStream?.bitRate?.formatBitrate() ?? "-"}</>}
                />

                {/* Resolution */}
                <DataRow
                  label={t("stream.resolution", "Resolution")}
                  current={`${ti?.width ?? videoStream?.width ?? UNKNOWN} x ${ti?.height ?? videoStream?.height ?? UNKNOWN}`}
                  source={`${videoStream?.width ?? UNKNOWN} x ${videoStream?.height ?? UNKNOWN}`}
                />

                {/* Framerate */}
                <DataRow
                  label={t("stream.framerate", "Framerate")}
                  current={videoStream?.realFrameRate ? parseFloat(videoStream.realFrameRate.toFixed(2)).toString() : UNKNOWN}
                  source={videoStream?.realFrameRate ? parseFloat(videoStream.realFrameRate.toFixed(2)).toString() : UNKNOWN}
                />

                {/* Dynamic Range */}
                <DataRow
                  label={t("stream.dynamic_range", "Dynamic Range")}
                  current={videoStream?.videoRange || UNKNOWN}
                  source={videoStream?.videoRange || UNKNOWN}
                />

                {/* Aspect Ratio */}
                <DataRow
                  label={t("stream.aspect_ratio", "Aspect")}
                  current={videoStream?.aspectRatio || UNKNOWN}
                  source={videoStream?.aspectRatio || UNKNOWN}
                />

                {/* Audio section */}
                <SectionHeader title={t("common.audio", "Audio")} badge={playMethodBadge(playMethod, ti, false, t)} />

                {/* Codec */}
                <DataRow
                  label={t("stream.codec", "Codec")}
                  current={(ti?.audioCodec ?? audioStream?.codec)?.toUpperCase() || UNKNOWN}
                  source={audioStream?.codec?.toUpperCase() || UNKNOWN}
                />

                {/* Bitrate */}
                <DataRow
                  label={t("stream.bitrate", "Bitrate")}
                  current={<>{(ti && ti.isAudioDirect === false ? ti.bitrate : audioStream?.bitRate)?.formatBitrate() ?? "-"}</>}
                  source={<>{audioStream?.bitRate?.formatBitrate() ?? "-"}</>}
                />

                {/* Channels */}
                <DataRow
                  label={t("stream.channels", "Channels")}
                  current={ti && ti.isAudioDirect === false ? String(ti.audioChannels) : String(audioStream?.channels ?? UNKNOWN)}
                  source={String(audioStream?.channels ?? UNKNOWN)}
                />

                {/* Language */}
                <DataRow
                  label={t("stream.language", "Language")}
                  current={<span className="font-semibold">{langVal}</span>}
                  source={<span className="font-semibold">{langVal}</span>}
                />

                {/* Transcode reasons */}
                {ti?.transcodeReasons && ti.transcodeReasons.length > 0 && (
                  <>
                    <SectionHeader title={t("stream.transcode_reasons", "Transcode Reasons")} />
                    <tr>
                      <td colSpan={3} className="py-2">
                        <div className="rounded-xl bg-brand-amber/10 border border-brand-amber/20 p-3">
                          <div className="text-xs text-brand-amber font-medium leading-relaxed space-y-1">
                            {ti.transcodeReasons.map((reason, i) => (
                              <div key={i}>{reason}</div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* ---- FOOTER ---- */}
          <div className="flex items-center justify-end gap-2 border-t border-border px-4 sm:px-6 py-3 bg-background/40">
            <button
              onClick={() => {
                setVisible(false);
                setTimeout(onClose, 150);
              }}
              autoFocus
              className="px-4 py-2 rounded-lg bg-surface border border-border text-gray-300 hover:text-white hover:border-gray-500 transition-all text-xs font-bold"
            >
              {t("common.close", "Close")}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
