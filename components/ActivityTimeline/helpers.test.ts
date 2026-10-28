import { isSameDay, parseStoredIds, splitDuration } from "./helpers";

describe("timeline helpers", () => {
  it("detects same calendar day", () => {
    expect(isSameDay("2026-03-01T10:00:00", "2026-03-01T23:59:00")).toBe(true);
    expect(isSameDay("2026-03-01T10:00:00", "2026-03-02T00:01:00")).toBe(false);
  });

  it("splits durations", () => {
    expect(splitDuration(0)).toEqual({ hours: 0, minutes: 0 });
    expect(splitDuration(20)).toEqual({ hours: 0, minutes: 1 });
    expect(splitDuration(3600)).toEqual({ hours: 1, minutes: 0 });
    expect(splitDuration(3601)).toEqual({ hours: 1, minutes: 1 });
    expect(splitDuration(7199)).toEqual({ hours: 2, minutes: 0 });
  });

  it("parses stored ids defensively", () => {
    expect(parseStoredIds(null)).toBeNull();
    expect(parseStoredIds("not json")).toBeNull();
    expect(parseStoredIds('{"a":1}')).toBeNull();
    expect(parseStoredIds('["a","b"]')).toEqual(["a", "b"]);
  });
});
