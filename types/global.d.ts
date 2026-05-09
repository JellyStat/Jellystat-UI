declare global {
  interface Number {
    ticksToDurationString(): string | null;
    secondsToDurationString(): string | null;
  }
}

export {};
