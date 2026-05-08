import { MediaStreamType } from "./enums/MediaStreamType";

export interface BaseMediaStream {
  codec?: string | null;
  videoRange?: string | null;
  displayTitle?: string | null;
  bitRate?: number | null;
  height?: number | null;
  width?: number | null;
  realFrameRate?: number | null;
  type?: MediaStreamType;
  aspectRatio?: string | null;
  index?: number | null;
}

export default BaseMediaStream;
