import React from "react";
import {
  Card,
  Image,
  Group,
  Stack,
  Text,
  Progress,
  Badge,
  Box,
  Avatar,
  BackgroundImage,
  CardSection,
  Space,
} from "@mantine/core";
import { API_BASE } from "@/lib/api";
import SessionItem from "@/lib/models/sessionItem";
import ItemTypes from "@/lib/models/enums/ItemTypes";
import { IconPlayerPause, IconPlayerPauseFilled, IconPlayerPlay, IconPlayerPlayFilled } from "@tabler/icons-react";
import ItemTypeIcons from "@/lib/declarations/itemIcons";
import ItemImage from "../ItemImage/ItemImage.tsx";
import { useRouter } from "next/router";

export type SessionCardProps = {
  session: SessionItem;
};

function convertBitrate(bitrate: number) {
  if (!bitrate) {
    return "N/A";
  }
  const kbps: number = parseFloat((bitrate / 1000).toFixed(1));
  const mbps: number = parseFloat((bitrate / 1000000).toFixed(1));

  if (kbps >= 1000) {
    return mbps + " Mbps";
  } else {
    return kbps + " Kbps";
  }
}

function getcontainer(item: SessionItem) {
  let transcodeContainer = "";
  if (item.transcodingInfo && item.transcodingInfo.container)
    transcodeContainer = ` -> ${item.transcodingInfo.container.toUpperCase()}`;

  let NowPlayingItemContainer = item?.nowPlayingItem?.container ?? "";
  if (item?.nowPlayingItem?.container && item?.nowPlayingItem?.type == ItemTypes.TvChannel) {
    NowPlayingItemContainer = "LiveTV";
  }
  return `${NowPlayingItemContainer.toUpperCase()}${transcodeContainer}`;
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
    item?.type == ItemTypes.Audio
      ? (item.container ?? "").toUpperCase()
      : item?.mediaStreams && validStreamIndex
        ? `${(item.mediaStreams[streamIndex]?.codec ?? "").toUpperCase()}${item.mediaStreams[streamIndex]?.channels ? `-${item.mediaStreams[streamIndex].channels}Ch` : ""}`
        : "";

  const hasNoStream = !validStreamIndex && item?.type !== ItemTypes.Audio;
  return hasNoStream ? "" : originalCodec ? `${transcodeType} (${originalCodec}${transcodeCodec})` : transcodeType;
}

function getAudioBitrate(session: SessionItem) {
  let mediaTypeAudio = session.nowPlayingItem?.type === ItemTypes.Audio;
  let streamIndex = session.playState?.audioStreamIndex ?? -1;
  if ((streamIndex === undefined || streamIndex === -1) && !mediaTypeAudio) {
    return "";
  }

  let transcodeBitRate = "";
  // if (session.transcodingInfo && session.transcodingInfo.audioBitrate) {
  //   transcodeBitRate = " -> " + convertBitrate(session.transcodingInfo.audioBitrate);
  // }

  let originalBitrate = "";
  // if (mediaTypeAudio && session.nowPlayingItem?.bitrate) {
  //   originalBitrate = convertBitrate(session.nowPlayingItem?.bitrate);
  // } else
  if (
    session.nowPlayingItem?.mediaStreams &&
    session.nowPlayingItem.mediaStreams.length &&
    streamIndex < session.nowPlayingItem.mediaStreams.length &&
    session.nowPlayingItem.mediaStreams[streamIndex].bitRate
  ) {
    originalBitrate = convertBitrate(session.nowPlayingItem.mediaStreams[streamIndex].bitRate);
  } else if (transcodeBitRate) {
    originalBitrate = "N/A";
  }
  return `${originalBitrate}${transcodeBitRate}`;
}

function getVideoResolution(videoHeight: number | null | undefined) {
  let videoResolution = "";
  if (!videoHeight) return videoResolution;
  if (videoHeight > 2160) {
    videoResolution = "8K";
  } else if (videoHeight > 1080) {
    videoResolution = "4K";
  } else if (videoHeight > 720) {
    videoResolution = "1080p";
  } else if (videoHeight > 480) {
    videoResolution = "720p";
  } else if (videoHeight > 360) {
    videoResolution = "480p";
  } else if (videoHeight > 240) {
    videoResolution = "360p";
  } else {
    videoResolution = "240p";
  }
  return videoResolution;
}

function getVideo(session: SessionItem) {
  let videoStream = session.nowPlayingItem?.mediaStreams?.find((stream) => stream.type === "Video");

  if (videoStream === undefined) {
    return "";
  }

  let transcodeType = "Direct Play";
  let transcodeVideoCodec = "";
  let transcodeVideoResolution = "";
  if (session.transcodingInfo && !session.transcodingInfo.isVideoDirect) {
    transcodeType = "Transcode";
    transcodeVideoResolution = getVideoResolution(session.transcodingInfo.height);
    transcodeVideoCodec = ` -> ${session.transcodingInfo.videoCodec?.toUpperCase()}-${transcodeVideoResolution}`;
  }

  const originalVideoCodec = videoStream.codec?.toUpperCase();
  let videoResolution = getVideoResolution(videoStream.height);

  return `${transcodeType} (${originalVideoCodec}-${videoResolution}${transcodeVideoCodec})`;
}

function getVideoBitrate(session: SessionItem) {
  let videoStream = session.nowPlayingItem?.mediaStreams?.find((stream) => stream.type === "Video");
  if (videoStream === undefined) {
    return "";
  }

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

function LabeledText({ label, value }: { label: string; value: string | undefined | null }) {
  if (!value) return null;
  const router = useRouter();
  return (
    <Group align="center" w="100%" wrap="nowrap">
      <Text color="dimmed" size="xs" w={100} style={{ textAlign: "end" }}>
        {label}
      </Text>
      <Text size="xs" w="100%">
        {value}
      </Text>
    </Group>
  );
}

export default function SessionCard({ session }: SessionCardProps) {
  if (!session || !session.nowPlayingItem) return null;
  const router = useRouter();
  const item = session?.nowPlayingItem;
  const imageUrl =
    (item?.seriesId ?? item?.id)
      ? `${API_BASE}Proxy/Images/Items/Primary?Id=${encodeURIComponent(item?.seriesId ?? item?.id ?? "")}&Width=160&ServerId=${encodeURIComponent(session.serverId ?? "")}`
      : "";

  const backgroundImage = `${API_BASE}Proxy/Images/Items/Backdrop?Id=${encodeURIComponent(item?.seriesId ?? item?.id ?? "")}&Width=300&Quality=80&ServerId=${encodeURIComponent(session.serverId ?? "")}`;
  const deviceImage = `${API_BASE}Proxy/Images/Devices?DeviceName=${encodeURIComponent(session.deviceName ?? "")}&Width=50&Quality=80&ServerId=${encodeURIComponent(session.serverId ?? "")}`;
  const userImage = `${API_BASE}Proxy/Images/User/Primary?ServerId=${encodeURIComponent(session.serverId ?? "")}&Id=${encodeURIComponent(session.userId ?? "")}&Width=80`;

  const container = getcontainer(session);
  const video = getVideo(session);
  const videoBitrate = getVideoBitrate(session);
  const audio = getAudio(session);
  const audioBitrate = getAudioBitrate(session); // getAudioBitrate(session);
  const ip = session.ipAddress ?? "";

  const TICKS_PER_MS = 10000;
  const etaDate = new Date(Date.now() + Math.round((item?.runtimeTicks ?? 0) / TICKS_PER_MS));
  const eta = etaDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const progressVal = ((session.playState?.positionTicks ?? 0) / (item?.runtimeTicks ?? 1)) * 100;
  const subtitles = (item?.mediaStreams ?? [])[session.playState?.subtitleStreamIndex ?? -1]?.displayTitle ?? "";
  const TypeIcon = ItemTypeIcons[item.type ?? ItemTypes.Unknown];
  const indexString: string | null =
    item.parentIndexNumber && item.indexNumber ? `S${item.parentIndexNumber} - E${item.indexNumber}` : null;

  return (
    <Card p={0} style={{ backgroundColor: "transparent" }}>
      <Card.Section p={0} m={0}>
        <BackgroundImage
          src={backgroundImage}
          radius="md"
          style={{
            backdropFilter: "blur(10px)",
            // maxWidth: 700,
          }}
        >
          <Card
            orientation="horizontal"
            shadow="sm"
            style={{
              width: "100%",
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              height: 240,
              backdropFilter: "blur(10px)",
              backgroundColor: "light-dark(rgba(255, 255, 255, 0.5), rgba(0, 0, 0, 0.5))",
            }}
          >
            <Card.Section
              style={{
                height: 240,
                flex: "0 0 160px",
                display: "block",
                borderTopLeftRadius: 8,

                overflow: "hidden",
              }}
            >
              <ItemImage
                imageUrl={imageUrl}
                imageHash={item.imageHash}
                width={160}
                height={240}
                onClick={() => {
                  router.push(`/items/${encodeURIComponent(item?.id ?? "")}`);
                  console.log("Item clicked:", item);
                }}
              />
            </Card.Section>
            <Card.Section h={240} style={{ width: "100%", minWidth: 0 }}>
              <Stack justify="space-between" w="100%" h="100%" style={{ padding: 12 }}>
                <Group w="100%" justify="space-between" align="start" wrap="nowrap">
                  <Stack gap={8}>
                    <Stack gap={2}>
                      <LabeledText label="DEVICE" value={session.deviceName} />
                      <LabeledText label="CLIENT" value={session.client} />
                    </Stack>
                    <Stack gap={2}>
                      <LabeledText label="CONTAINER" value={container} />
                      <LabeledText label="VIDEO" value={video + " " + videoBitrate} />
                      {/* <LabeledText label="" value={videoBitrate} /> */}
                      <LabeledText label="AUDIO" value={audio + " " + audioBitrate} />
                      {/* <LabeledText label="" value={audioBitrate} /> */}
                      <LabeledText label="SUBTITLES" value={subtitles} />
                    </Stack>
                    <Stack gap={2}>
                      <LabeledText label="IP ADDRESS" value={ip} />
                      <LabeledText label="ETA" value={eta} />
                    </Stack>
                  </Stack>
                  <Image src={deviceImage} w={50} h={50} />
                </Group>
                <Text w="100%" style={{ textAlign: "end" }}>
                  {session.playState?.positionTicks?.ticksToTimeString()} / {item?.runtimeTicks?.ticksToTimeString()}
                </Text>
              </Stack>
            </Card.Section>
          </Card>
        </BackgroundImage>
      </Card.Section>
      <Card.Section p={0} m={0}>
        <Progress
          value={progressVal}
          size="md"
          styles={() => ({
            root: { borderRadius: "0 0 8px 8px" },
            section: {
              background: "linear-gradient(90deg,#774df7,#1588bf)",
              borderRadius: "0 0 8px 8px",
            },
          })}
        />
        <Space h={4} />
        <Group justify="space-between">
          <Stack gap={4}>
            <Group>
              {session.isPaused ? <IconPlayerPauseFilled size={20} /> : <IconPlayerPlayFilled size={20} />}

              <Text style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>
                {item.seriesName ? item.seriesName + " : " : ""}
                {item?.name}
              </Text>
            </Group>
            {item?.type == ItemTypes.Episode && (
              <Group>
                <TypeIcon size={20} />
                {indexString && (
                  <Text style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>
                    {indexString}
                  </Text>
                )}
              </Group>
            )}
          </Stack>
          <Group gap={4} h="100%" align="center" style={{ flexShrink: 0 }}>
            <Text>{session.userName}</Text>
            <Avatar src={userImage} alt={session.userName} />
          </Group>
        </Group>
      </Card.Section>
    </Card>
  );
}
