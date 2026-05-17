declare global {
  interface Number {
    ticksToDurationString(): string | null;
    ticksToTimeString(): string | null;
    secondsToDurationString(): string | null;
    secondsToTimeString(): string | null;
    formatBytes(): string | null;
  }
}

export {};
