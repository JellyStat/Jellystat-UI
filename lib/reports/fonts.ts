import { useEffect, useState } from "react";
import client, { API_BASE } from "@/lib/api";
import type { ReportFontFamily } from "@/lib/models/reports";

// Fallbacks after a bundled family, so text still renders sensibly while fonts load or if they can't
const FALLBACKS: Record<string, string> = {
  "sans-serif": "Segoe UI, DejaVu Sans, Arial, sans-serif",
  serif: "Georgia, DejaVu Serif, Times New Roman, serif",
  monospace: "Consolas, DejaVu Sans Mono, monospace",
  display: "Impact, Arial Narrow, sans-serif",
};

/** The font-family value stored on elements for a bundled family. */
export const fontStack = (family: ReportFontFamily) => `'${family.family}', ${FALLBACKS[family.category] ?? FALLBACKS["sans-serif"]}`;

/** The first family named in a CSS font-family list, without quotes. */
export const firstFamily = (stack: string | null | undefined) =>
  (stack ?? "")
    .split(",")[0]
    .trim()
    .replace(/^['"]|['"]$/g, "");

let loading: Promise<ReportFontFamily[]> | null = null;

/**
 * Registers the report fonts the API serves (the same files server exports draw with) as @font-face rules.
 * Runs once per page load; browsers only download the faces a report actually uses.
 */
export function loadReportFonts(): Promise<ReportFontFamily[]> {
  if (!loading) {
    loading = client.Reports.fonts()
      .then((families) => {
        if (typeof document !== "undefined" && !document.getElementById("jellystat-report-fonts")) {
          const css = families
            .flatMap((f) =>
              f.files.map(
                (face) =>
                  `@font-face{font-family:'${f.family}';font-weight:${face.weight};font-style:${face.italic ? "italic" : "normal"};font-display:swap;` +
                  `src:url('${API_BASE}/Reports/Fonts/${encodeURIComponent(face.file)}') format('truetype')}`,
              ),
            )
            .join("\n");
          const style = document.createElement("style");
          style.id = "jellystat-report-fonts";
          style.textContent = css;
          document.head.appendChild(style);
        }
        return families;
      })
      .catch(() => {
        // Reports still render with system fonts; try again next time
        loading = null;
        return [];
      });
  }
  return loading;
}

/**
 * The bundled report fonts, plus a counter that changes whenever web fonts finish loading. Components that measure
 * text (charts, tables) re-render on it, so ellipses and axis spacing use the real font, not its fallback.
 */
export function useReportFonts() {
  const [families, setFamilies] = useState<ReportFontFamily[]>([]);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    void loadReportFonts().then((f) => active && setFamilies(f));
    if (typeof document === "undefined" || !document.fonts) {
      return () => {
        active = false;
      };
    }
    const bump = () => active && setVersion((v) => v + 1);
    document.fonts.addEventListener("loadingdone", bump);
    return () => {
      active = false;
      document.fonts.removeEventListener("loadingdone", bump);
    };
  }, []);

  return { families, version };
}
