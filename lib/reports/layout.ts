// Page flow, same rules as ReportPaginator in Services/Reports/Rendering/ReportLayout.cs on the server. The viewer
// uses the server's layout; the designer works it out here for its preview and in-browser exports. Change both together.
import type { ReportElement, ReportLayoutPage, ReportPage } from "@/lib/models/reports";
import type { RenderContext } from "@/components/Reports/render/ReportElementView";
import { defaultCardOptions, defaultTableOptions } from "./defaults";
import { findData } from "./format";

export const MAX_PAGES = 500;
export const DEFAULT_CONTINUE_TOP = 40;

export const isGrowing = (e: ReportElement) => !e.hidden && !!e.grow && (e.type === "table" || e.type === "cards");

/**
 * The header and footer zones of a page with growing elements: elements entirely above `header` or below `footer`
 * repeat on the extra pages. Null when nothing on the page grows.
 */
export function pageZones(page: ReportPage | undefined): { header: number; footer: number } | null {
  const growing = page?.elements.filter(isGrowing) ?? [];
  if (growing.length === 0) {
    return null;
  }
  return {
    header: Math.min(...growing.map((g) => Math.min(g.continueTop ?? DEFAULT_CONTINUE_TOP, g.y))),
    footer: Math.max(...growing.map((g) => g.y + g.height)),
  };
}

/** Same rule as ReportPaginator.RepeatsOnExtraPages: header and footer zones repeat, the rest is first-page only. */
export function repeatsOnExtraPages(page: ReportPage | undefined, e: ReportElement): boolean {
  const zones = pageZones(page);
  if (!zones || e.firstPageOnly || isGrowing(e)) {
    return false;
  }
  return e.y + e.height <= zones.header + 0.5 || e.y >= zones.footer - 0.5;
}

/** Rows the element shows in total (all pages), after its own row limit. */
export function totalRows(e: ReportElement, model: RenderContext): number {
  const data = findData(model, e.dataSourceId);
  if (!data || data.error) {
    return 0;
  }
  const limit = e.type === "cards" ? e.cards?.maxItems : e.table?.maxRows;
  return Math.min(data.rows.length, Math.max(0, limit ?? Number.MAX_SAFE_INTEGER));
}

/** How many rows fit in an element of this height. */
export function capacity(e: ReportElement, height: number): number {
  const inner = height - 2 * e.style.padding;
  if (e.type === "cards") {
    const o = { ...defaultCardOptions(), ...(e.cards ?? {}) };
    const columns = Math.min(24, Math.max(1, Math.round(o.columns)));
    const gap = Math.max(0, o.gap);
    return Math.max(0, Math.floor((inner + gap) / (Math.max(20, o.cardHeight) + gap))) * columns;
  }
  const t = { ...defaultTableOptions(), ...(e.table ?? {}) };
  const rowH = Math.max(12, t.rowHeight);
  return Math.max(0, Math.floor((inner - (t.showHeader ? rowH : 0)) / rowH));
}

/** Each design page, followed by the extra pages its growing tables and card grids need. */
export function paginate(model: RenderContext): ReportLayoutPage[] {
  const pages: ReportLayoutPage[] = [];
  model.definition.pages.forEach((designPage, p) => {
    if (pages.length >= MAX_PAGES) {
      return;
    }
    const growing = designPage.elements
      .filter(isGrowing)
      .map((e) => ({ e, total: totalRows(e, model) }))
      .filter((g) => g.total > 0);
    const next: Record<string, number> = Object.fromEntries(growing.map((g) => [g.e.id, 0]));
    for (let continuation = 0; pages.length < MAX_PAGES; continuation++) {
      const page: ReportLayoutPage = { page: p, continuation, slices: {} };
      for (const { e, total } of growing) {
        const start = next[e.id];
        if (start >= total) {
          continue;
        }
        // Extra pages: the element moves up to its continue position and keeps its bottom edge
        const y = continuation === 0 ? e.y : Math.min(e.continueTop ?? DEFAULT_CONTINUE_TOP, e.y);
        const height = e.y + e.height - y;
        const fit = capacity(e, height);
        if (fit <= 0) {
          next[e.id] = total;
          continue;
        }
        const count = Math.min(fit, total - start);
        page.slices[e.id] = { start, count, y, height };
        next[e.id] = start + count;
      }
      pages.push(page);
      if (growing.every((g) => next[g.e.id] >= g.total)) {
        break;
      }
    }
  });
  return pages;
}
