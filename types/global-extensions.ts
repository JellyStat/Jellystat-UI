// Runtime extensions for built-in types.
// Implement Number#toDurationString so nullable numbers can use optional chaining:
//   const s = item.duration?.toDurationString();

Number.prototype.toDurationString = function (): string {
  const ticks = Number(this.valueOf());
  if (!ticks) return "";
  const s = Math.floor(ticks / 1e7);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
};

export {};
