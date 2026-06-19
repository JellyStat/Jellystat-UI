import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { Play, Pause, Tv } from "lucide-react";

import { API_BASE } from "@/lib/api";
import SessionItem from "@/lib/models/sessionItem";
import ItemTypes from "@/lib/models/enums/ItemTypes";
import ItemTypeIcons from "@/lib/declarations/itemIcons";
import ItemImage from "../ItemImage/ItemImage";
import DeviceIcon from "../DeviceIcon/DeviceIcon";

export type SessionCardProps = {
  session: SessionItem;
};

// --- HELPER FUNCTIONS ---
function convertBitrate(bitrate: number) {
  if (!bitrate) return "N/A";
  const kbps: number = parseFloat((bitrate / 1000).toFixed(1));
  const mbps: number = parseFloat((bitrate / 1000000).toFixed(1));
  return kbps >= 1000 ? `${mbps} Mbps` : `${kbps} Kbps`;
}

function getContainer(item: SessionItem) {
  let transcodeContainer = "";
  if (item.transcodingInfo && item.transcodingInfo.container) {
    transcodeContainer = ` -> ${item.transcodingInfo.container.toUpperCase()}`;
  }

  let nowPlayingContainer = item?.nowPlayingItem?.container ?? "";
  if (item?.nowPlayingItem?.container && item?.nowPlayingItem?.type === ItemTypes.TvChannel) {
    nowPlayingContainer = "LiveTV";
  }
  return `${nowPlayingContainer.toUpperCase()}${transcodeContainer}`;
}

function getAudio(session: SessionItem) {
  const item = session.nowPlayingItem;
  const streamIndex = session.playState?.audioStreamIndex ?? -1;
  const validStreamIndex = streamIndex >= 0 && streamIndex < (item?.mediaStreams?.length ?? 0);

  const transcodeType = session.transcodingInfo && !session.transcodingInfo.isAudioDirect ? "Transcode" : "Direct Play";
  const transcodeCodec =
    session.transcodingInfo && !session.transcodingInfo.isAudioDirect && session.transcodingInfo.audioCodec
      ? ` -> ${session.transcodingInfo.audioCodec.toUpperCase()}-${session.transcodingInfo.audioChannels ?? ""}Ch`
      : "";

  const originalCodec =
    item?.type === ItemTypes.Audio
      ? (item.container ?? "").toUpperCase()
      : item?.mediaStreams && validStreamIndex
        ? `${(item.mediaStreams[streamIndex]?.codec ?? "").toUpperCase()}${item.mediaStreams[streamIndex]?.channels ? `-${item.mediaStreams[streamIndex].channels}Ch` : ""}`
        : "";

  const hasNoStream = !validStreamIndex && item?.type !== ItemTypes.Audio;
  return hasNoStream ? "" : originalCodec ? `${transcodeType} (${originalCodec}${transcodeCodec})` : transcodeType;
}

function getAudioBitrate(session: SessionItem) {
  const mediaTypeAudio = session.nowPlayingItem?.type === ItemTypes.Audio;
  const streamIndex = session.playState?.audioStreamIndex ?? -1;
  if ((streamIndex === undefined || streamIndex === -1) && !mediaTypeAudio) return "";

  let transcodeBitRate = "";
  let originalBitrate = "";

  if (
    session.nowPlayingItem?.mediaStreams &&
    session.nowPlayingItem.mediaStreams.length &&
    streamIndex < session.nowPlayingItem.mediaStreams.length &&
    session.nowPlayingItem.mediaStreams[streamIndex].bitRate
  ) {
    originalBitrate = convertBitrate(session.nowPlayingItem.mediaStreams[streamIndex].bitRate!);
  } else if (transcodeBitRate) {
    originalBitrate = "N/A";
  }
  return `${originalBitrate}${transcodeBitRate}`;
}

function getVideoResolution(videoHeight: number | null | undefined) {
  if (!videoHeight) return "";
  if (videoHeight > 2160) return "8K";
  if (videoHeight > 1080) return "4K";
  if (videoHeight > 720) return "1080p";
  if (videoHeight > 480) return "720p";
  if (videoHeight > 360) return "480p";
  if (videoHeight > 240) return "360p";
  return "240p";
}

function getVideo(session: SessionItem) {
  const videoStream = session.nowPlayingItem?.mediaStreams?.find((stream) => stream.type === "Video");
  if (!videoStream) return "";

  let transcodeType = "Direct Play";
  let transcodeVideoCodec = "";
  let transcodeVideoResolution = "";

  if (session.transcodingInfo && !session.transcodingInfo.isVideoDirect) {
    transcodeType = "Transcode";
    transcodeVideoResolution = getVideoResolution(session.transcodingInfo.height);
    transcodeVideoCodec = ` -> ${session.transcodingInfo.videoCodec?.toUpperCase()}-${transcodeVideoResolution}`;
  }

  const originalVideoCodec = videoStream.codec?.toUpperCase();
  const videoResolution = getVideoResolution(videoStream.height);

  return `${transcodeType} (${originalVideoCodec}-${videoResolution}${transcodeVideoCodec})`;
}

function getVideoBitrate(session: SessionItem) {
  const videoStream = session.nowPlayingItem?.mediaStreams?.find((stream) => stream.type === "Video");
  if (!videoStream) return "";

  let transcodeBitrate = "";
  if (session.transcodingInfo && !session.transcodingInfo.isVideoDirect && session.transcodingInfo.bitrate) {
    transcodeBitrate = ` -> ${convertBitrate(session.transcodingInfo.bitrate)}`;
  }

  let originalBitrate = "";
  if (videoStream.bitRate) {
    originalBitrate = convertBitrate(videoStream.bitRate);
  }

  return `${originalBitrate}${transcodeBitrate}`;
}

// --- SUB-COMPONENT ---
function LabeledText({ label, value }: { label: string; value: string | undefined | null }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 w-full flex-nowrap">
      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider w-20 text-right shrink-0">{label}</span>
      <span className="text-xs text-gray-200 font-medium truncate" title={value}>
        {value}
      </span>
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function SessionCard({ session }: SessionCardProps) {
  const router = useRouter();
  const { t } = useTranslation("common");

  if (!session || !session.nowPlayingItem) return null;

  const item = session.nowPlayingItem;

  // Images
  const imageUrl =
    (item?.seriesId ?? item?.id)
      ? `${API_BASE}Proxy/Images/Items/Primary?Id=${encodeURIComponent(item?.seriesId ?? item?.id ?? "")}&Width=160&ServerId=${encodeURIComponent(session.serverId ?? "")}`
      : "";
  const backgroundImage = `${API_BASE}Proxy/Images/Items/Backdrop?Id=${encodeURIComponent(item?.seriesId ?? item?.id ?? "")}&Width=600&Quality=80&ServerId=${encodeURIComponent(session.serverId ?? "")}`;
  const userImage = `${API_BASE}Proxy/Images/User/Primary?ServerId=${encodeURIComponent(session.serverId ?? "")}&Id=${encodeURIComponent(session.userId ?? "")}&Width=80`;

  // Telemetry strings
  const container = getContainer(session);
  const video = getVideo(session);
  const videoBitrate = getVideoBitrate(session);
  const audio = getAudio(session);
  const audioBitrate = getAudioBitrate(session);
  const ip = session.ipAddress ?? "";

  // Time & Progress
  const TICKS_PER_MS = 10000;
  const etaDate = new Date(Date.now() + Math.round((item?.runtimeTicks ?? 0) / TICKS_PER_MS));
  const eta = etaDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const progressVal = ((session.playState?.positionTicks ?? 0) / (item?.runtimeTicks ?? 1)) * 100;

  const subtitles = (item?.mediaStreams ?? [])[session.playState?.subtitleStreamIndex ?? -1]?.displayTitle ?? "";
  const TypeIcon = ItemTypeIcons[item.type ?? ItemTypes.Unknown] ?? Tv;
  const indexString = item.parentIndexNumber && item.indexNumber ? `S${item.parentIndexNumber} - E${item.indexNumber}` : null;

  return (
    <div className="relative flex flex-col bg-surface border border-border rounded-2xl overflow-hidden shadow-xl hover:border-brand-cyan/40 hover:shadow-brand-cyan/10 transition-all duration-300 group">
      {/* Background Blur Image */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0 opacity-30 mix-blend-screen"
        style={{ backgroundImage: `url('${backgroundImage}')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-background/60 z-0"></div>

      {/* Top Section: Media Cover + Telemetry Data */}
      <div className="relative z-10 flex h-[240px]">
        {/* Left: Poster */}
        <div className="w-[160px] shrink-0 h-full border-r border-white/5">
          <ItemImage
            imageUrl={imageUrl}
            imageHash={item.imageHash}
            width={160}
            height="100%"
            borderRadius={[16, 0, 0, 0]}
            onClick={() => router.push(`/libraries/items/${encodeURIComponent(item?.id ?? "")}`)}
          />
        </div>

        {/* Right: Telemetry Information */}
        <div className="flex-1 flex flex-col p-3.5 justify-between min-w-0">
          {/* Header Row (Device Name & Icon) */}
          <div className="flex justify-between items-start gap-2 mb-2 w-full">
            <div className="flex flex-col gap-1 w-full min-w-0 mt-1">
              <LabeledText label={t("session.device", "DEVICE")} value={session.deviceName} />
              <LabeledText label={t("session.client", "CLIENT")} value={session.client} />
            </div>

            {/* Device Icon Mapper */}
            <div className="shrink-0 flex items-center justify-center p-2 bg-background/50 border border-border rounded-xl shadow-inner">
              <DeviceIcon
                client={session.client ?? ""}
                deviceName={session.deviceName ?? ""}
                deviceIconUrl={
                  session.deviceIconUrl
                    ? `${API_BASE}Proxy/Images/Devices?ServerId=${encodeURIComponent(session.serverId ?? "")}&iconUrl=${encodeURIComponent(session.deviceIconUrl)}`
                    : ""
                }
                className="w-6 h-6 drop-shadow-lg"
              />
            </div>
          </div>

          {/* Details Row */}
          <div className="flex flex-col gap-1.5 w-full">
            <LabeledText label={t("session.container", "CONTAINER")} value={container} />
            <LabeledText label={t("session.video", "VIDEO")} value={`${video} ${videoBitrate}`} />
            <LabeledText label={t("session.audio", "AUDIO")} value={`${audio} ${audioBitrate}`} />
            <LabeledText label={t("session.subtitles", "SUBTITLES")} value={subtitles} />
          </div>

          {/* Footer Row (IP, ETA, Time) */}
          <div className="flex flex-col gap-1 w-full mt-auto pt-2 border-t border-white/5">
            <LabeledText label={t("session.ip_address", "IP ADDRESS")} value={ip} />
            <LabeledText label={t("session.eta", "ETA")} value={eta} />
            <div className="text-right w-full mt-1">
              <span className="text-[10px] font-mono text-gray-400 bg-background/50 px-2 py-1 rounded shadow-inner border border-border">
                {session.playState?.positionTicks?.ticksToTimeString?.() || "0:00"} /{" "}
                {item?.runtimeTicks?.ticksToTimeString?.() || "0:00"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative z-10 w-full h-1.5 bg-black/50 border-y border-white/5">
        <div
          className="h-full bg-gradient-to-r from-brand-purple to-brand-cyan shadow-[0_0_10px_rgba(0,164,220,0.4)] transition-all duration-1000 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progressVal))}%` }}
        ></div>
      </div>

      {/* Bottom Section: Title & User */}
      <div className="relative z-10 p-3 bg-surface/80 flex items-center justify-between gap-4">
        {/* Title & Status */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`p-1.5 rounded-full ${session.isPaused ? "bg-brand-amber/20 text-brand-amber" : "bg-brand-emerald/20 text-brand-emerald"} shrink-0`}
          >
            {session.isPaused ? <Pause size={14} className="fill-current" /> : <Play size={14} className="fill-current" />}
          </div>
          <div className="flex flex-col min-w-0">
            <span
              className="text-sm font-bold text-white truncate drop-shadow-sm hover:text-brand-purple transition-colors cursor-pointer"
              onClick={() => router.push(`/libraries/items/${encodeURIComponent(item?.id ?? "")}`)}
            >
              {item.seriesName ? `${item.seriesName} : ` : ""}
              {item?.name}
            </span>
            {item?.type === ItemTypes.Episode && (
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                <TypeIcon size={10} />
                {indexString && <span className="truncate">{indexString}</span>}
              </div>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-2 shrink-0 bg-background/50 pl-3 pr-1 py-1 rounded-full border border-border shadow-inner">
          <span
            className="text-xs font-bold text-gray-200 hover:text-brand-purple transition-colors cursor-pointer"
            onClick={() => router.push(`/users/${encodeURIComponent(session.userId ?? "")}`)}
          >
            {session.userName}
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={userImage}
            alt={session.userName}
            className="w-6 h-6 rounded-full object-cover border border-white/10"
            onError={(e) => {
              // Fallback if user avatar fails to load
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      </div>
    </div>
  );
}
