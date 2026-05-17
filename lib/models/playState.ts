export interface PlayState {
  isPaused?: boolean;
  playMethod?: string | null;
  subtitleStreamIndex?: number | null;
  audioStreamIndex?: number | null;
  positionTicks?: number | null | undefined;
}
