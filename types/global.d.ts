declare global {
  interface Array<T> {
    FirstOrDefault(predicate?: (value: T, index: number, array: T[]) => unknown): T | undefined;
  }

  interface Number {
    ticksToDurationString(): string | null;
    ticksToTimeString(): string | null;
    secondsToDurationString(): string | null;
    secondsToTimeString(): string | null;
    formatBytes(): string | null;
    formatTimeDifference(): string;
  }
}

export {};
