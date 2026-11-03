import { Film, AlertTriangle, X, CheckCircle2, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import Activity from "@/lib/models/activity";
import { BaseTranscodingInfo } from "@/lib/models/baseTranscodingInfo";
import "@/types/global-extensions";
import { Alert, Badge, Button, cn, IconButton, Modal, ModalPanel, ModalTitle } from "@/components/ui";

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
      <Badge tone="info" className="gap-1">
        <ArrowRight size={11} /> {t("stream.direct_stream", "Direct Stream")}
      </Badge>
    );
  }
  if (isDirect) {
    return (
      <Badge tone="accent" className="gap-1">
        <CheckCircle2 size={11} /> {t("common.direct", "Direct")}
      </Badge>
    );
  }
  return (
    <Badge tone="warning" className="gap-1">
      <AlertTriangle size={11} /> {t("common.transcode", "Transcode")}
    </Badge>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-background border border-border text-xs font-bold text-gray-200">
      {children}
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
  const isSame = typeof current === "string" && typeof source === "string" && current === source;
  const valueClass = isSame ? "text-gray-500" : "text-white";
  return (
    <tr>
      <td className="py-2 pr-3 sm:pr-5 text-xs font-semibold text-gray-400 uppercase tracking-wider w-20 sm:w-24 shrink-0">{label}</td>
      <td className={cn("py-2 pr-3 sm:pr-5 font-mono text-xs sm:text-sm tabular-nums leading-tight w-[110px] sm:w-[180px]", valueClass)}>
        {current}
      </td>
      <td
        className={cn("py-2 pr-3 sm:pr-5 font-mono text-xs sm:text-sm tabular-nums leading-tight w-[110px] sm:w-[180px] shrink-0", valueClass)}
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
      <td className="pt-4 pb-1.5 pr-3 sm:pr-5 text-xs font-bold uppercase tracking-wider text-primary-soft sm:whitespace-nowrap">{title}</td>
      <td colSpan={2} className="pt-4 pb-1.5">
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

  const close = () => {
    setVisible(false);
    setTimeout(onClose, 150);
  };

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
    <Modal open={visible} onClose={close}>
      {/* Sectioned layout: header bar, scrolling body, footer bar */}
      <ModalPanel size="xl" className="p-0 md:p-0 relative min-w-0 my-4 sm:my-8">
        {/* ---- HEADER ---- */}
        <div className="flex items-start justify-between border-b border-border px-4 sm:px-6 pt-5 pb-4 pr-14">
          <div className="min-w-0 flex-1">
            <ModalTitle className="text-lg truncate">
              {activity.seriesName ? `${activity.seriesName}: ${activity.fullName}` : activity.fullName || activity.name || ""}
            </ModalTitle>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Chip>
                <Film size={11} className="text-accent" /> {activity.userName || activity.userId || ""}
              </Chip>
              <Chip>{activity.client}</Chip>
              {activity.device && <Chip>{activity.device}</Chip>}
              <span className="ml-auto">{playMethodBadge(playMethod, ti, undefined, t)}</span>
            </div>
          </div>
          <IconButton label={t("common.close", "Close")} onClick={close} className="absolute top-4 right-4">
            <X size={18} />
          </IconButton>
        </div>

        {/* ---- TABLE ---- */}
        <div className="px-4 sm:px-6 py-3 overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-2 pr-3 sm:pr-5 w-20 sm:w-24 shrink-0"></th>
                <th className="py-2 pr-5 text-primary-soft text-left min-w-[100px] sm:min-w-[280px] align-middle">
                  {t("common.playback_stream", "Playback Stream")}
                </th>
                <th className="py-2 pr-5 text-gray-400 text-left w-[110px] sm:w-[180px] shrink-0 align-middle">
                  {t("common.source", "Source")}
                </th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <SectionHeader title={t("common.media", "Media")} />

              <DataRow label={t("stream.bitrate", "Bitrate")} current={<>{transcodeBitrate}</>} source={<>{origBitrate}</>} />

              <DataRow
                label={t("common.container", "Container")}
                current={(ti?.container ?? activity.container)?.toUpperCase() || UNKNOWN}
                source={activity.container?.toUpperCase() || UNKNOWN}
              />

              <SectionHeader title={t("common.video", "Video")} badge={playMethodBadge(playMethod, ti, true, t)} />

              <DataRow
                label={t("stream.codec", "Codec")}
                current={(ti?.videoCodec ?? videoStream?.codec)?.toUpperCase() || UNKNOWN}
                source={videoStream?.codec?.toUpperCase() || UNKNOWN}
              />

              <DataRow
                label={t("stream.bitrate", "Bitrate")}
                current={<>{vBitrate}</>}
                source={<>{videoStream?.bitRate?.formatBitrate() ?? "-"}</>}
              />

              <DataRow
                label={t("stream.resolution", "Resolution")}
                current={`${ti?.width ?? videoStream?.width ?? UNKNOWN} x ${ti?.height ?? videoStream?.height ?? UNKNOWN}`}
                source={`${videoStream?.width ?? UNKNOWN} x ${videoStream?.height ?? UNKNOWN}`}
              />

              <DataRow
                label={t("stream.framerate", "Framerate")}
                current={videoStream?.realFrameRate ? parseFloat(videoStream.realFrameRate.toFixed(2)).toString() : UNKNOWN}
                source={videoStream?.realFrameRate ? parseFloat(videoStream.realFrameRate.toFixed(2)).toString() : UNKNOWN}
              />

              <DataRow
                label={t("stream.dynamic_range", "Dynamic Range")}
                current={videoStream?.videoRange || UNKNOWN}
                source={videoStream?.videoRange || UNKNOWN}
              />

              <DataRow
                label={t("stream.aspect_ratio", "Aspect Ratio")}
                current={videoStream?.aspectRatio || UNKNOWN}
                source={videoStream?.aspectRatio || UNKNOWN}
              />

              <SectionHeader title={t("common.audio", "Audio")} badge={playMethodBadge(playMethod, ti, false, t)} />

              <DataRow
                label={t("stream.codec", "Codec")}
                current={(ti?.audioCodec ?? audioStream?.codec)?.toUpperCase() || UNKNOWN}
                source={audioStream?.codec?.toUpperCase() || UNKNOWN}
              />

              <DataRow
                label={t("stream.bitrate", "Bitrate")}
                current={<>{(ti && ti.isAudioDirect === false ? ti.bitrate : audioStream?.bitRate)?.formatBitrate() ?? "-"}</>}
                source={<>{audioStream?.bitRate?.formatBitrate() ?? "-"}</>}
              />

              <DataRow
                label={t("stream.channels", "Channels")}
                current={ti && ti.isAudioDirect === false ? String(ti.audioChannels) : String(audioStream?.channels ?? UNKNOWN)}
                source={String(audioStream?.channels ?? UNKNOWN)}
              />

              <DataRow
                label={t("common.language", "Language")}
                current={<span className="font-semibold">{langVal}</span>}
                source={<span className="font-semibold">{langVal}</span>}
              />

              {ti?.transcodeReasons && ti.transcodeReasons.length > 0 && (
                <>
                  <SectionHeader title={t("stream.transcode_reasons", "Transcode Reasons")} />
                  <tr>
                    <td colSpan={3} className="py-2">
                      <Alert tone="warning">
                        <div className="space-y-1">
                          {ti.transcodeReasons.map((reason, i) => (
                            <div key={i}>{reason}</div>
                          ))}
                        </div>
                      </Alert>
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* ---- FOOTER ---- */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-4 sm:px-6 py-3 bg-background/40 rounded-b-2xl">
          <Button variant="secondary" size="sm" onClick={close} autoFocus>
            {t("common.close", "Close")}
          </Button>
        </div>
      </ModalPanel>
    </Modal>
  );
}
