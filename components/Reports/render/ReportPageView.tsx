import { forwardRef } from "react";
import type { ReportLayoutPage } from "@/lib/models/reports";
import { repeatsOnExtraPages } from "@/lib/reports/layout";
import ReportElementView, { type RenderContext } from "./ReportElementView";

interface Props {
  model: RenderContext;
  pageIndex: number;
}

/** The pages to draw: the server's layout (design pages plus extra pages for growing elements), else one per design page. */
export function layoutPages(model: RenderContext): ReportLayoutPage[] {
  return model.layout?.length ? model.layout : model.definition.pages.map((_, i) => ({ page: i, continuation: 0, slices: {} }));
}

/** A finished page at 1:1 scale: what the viewer shows and what client-side PNG/PDF exports capture. */
const ReportPageView = forwardRef<HTMLDivElement, Props>(function ReportPageView({ model, pageIndex }, ref) {
  const { page } = model.definition;
  const pages = layoutPages(model);
  const layout = pages[pageIndex];
  const reportPage = layout ? model.definition.pages[layout.page] : undefined;
  return (
    <div ref={ref} className="relative overflow-hidden" style={{ width: page.width, height: page.height, background: page.background }}>
      {reportPage?.elements
        .filter((e) => !e.hidden)
        // Extra pages carry the growing elements still showing rows, plus the header and footer zones
        .filter((e) => layout.continuation === 0 || !!layout.slices[e.id] || repeatsOnExtraPages(reportPage, e))
        .map((e) => {
          const slice = layout.slices[e.id];
          const placed = slice ? { ...e, y: slice.y, height: slice.height } : e;
          return (
            <div key={e.id} className="absolute" style={{ left: placed.x, top: placed.y, width: placed.width, height: placed.height }}>
              <ReportElementView element={placed} model={model} pageNumber={pageIndex + 1} pageCount={pages.length} links slice={slice} />
            </div>
          );
        })}
    </div>
  );
});

export default ReportPageView;
