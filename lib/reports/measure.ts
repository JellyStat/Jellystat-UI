import type { ReportElementStyle } from "@/lib/models/reports";

let ctx: CanvasRenderingContext2D | null = null;

export function fontWeight(weight?: string | null): number {
  switch ((weight ?? "").toLowerCase()) {
    case "":
    case "normal":
      return 400;
    case "bold":
      return 700;
    case "lighter":
      return 300;
    case "bolder":
      return 800;
    default: {
      const n = Number.parseInt(weight ?? "", 10);
      return Number.isNaN(n) ? 400 : Math.min(900, Math.max(100, n));
    }
  }
}

/** Text width in px with the browser's fonts; the server measures with Skia, so results differ only slightly. */
export function measureText(text: string, style: ReportElementStyle, size?: number, weight?: string): number {
  if (!text) {
    return 0;
  }
  if (!ctx) {
    if (typeof document === "undefined") {
      return text.length * (size ?? style.fontSize) * 0.55;
    }
    ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) {
      return text.length * (size ?? style.fontSize) * 0.55;
    }
  }
  ctx.font = `${style.italic ? "italic " : ""}${fontWeight(weight ?? style.fontWeight)} ${size ?? style.fontSize}px ${style.fontFamily}`;
  return ctx.measureText(text).width;
}

export function ellipsis(text: string, width: number, style: ReportElementStyle, size: number, weight?: string): string {
  if (measureText(text, style, size, weight) <= width) {
    return text;
  }
  const avail = width - measureText("…", style, size, weight);
  if (avail <= 0) {
    return "";
  }
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (measureText(text.slice(0, mid), style, size, weight) <= avail) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return `${text.slice(0, lo).trimEnd()}…`;
}
