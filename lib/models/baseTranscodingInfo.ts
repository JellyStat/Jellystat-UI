export interface BaseTranscodingInfo {
  videoCodec?: string | null;
  audioCodec?: string | null;
  container?: string | null;
  isVideoDirect?: boolean;
  isAudioDirect?: boolean;
  bitrate?: number;
  completionPercentage?: number;
  width?: number;
  height?: number;
  transcodeReasons?: string[];
  audioChannels?: number;
}
