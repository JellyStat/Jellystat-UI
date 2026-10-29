import { forwardRef } from "react";
import ReportElementView, { type RenderContext } from "./ReportElementView";

interface Props {
  model: RenderContext;
  pageIndex: number;
}

/** A finished page at 1:1 scale: what the viewer shows and what client-side PNG/PDF exports capture. */
const ReportPageView = forwardRef<HTMLDivElement, Props>(function ReportPageView({ model, pageIndex }, ref) {
  const { page } = model.definition;
  const reportPage = model.definition.pages[pageIndex];
  return (
    <div ref={ref} className="relative overflow-hidden" style={{ width: page.width, height: page.height, background: page.background }}>
      {reportPage?.elements
        .filter((e) => !e.hidden)
        .map((e) => (
          <div key={e.id} className="absolute" style={{ left: e.x, top: e.y, width: e.width, height: e.height }}>
            <ReportElementView element={e} model={model} pageNumber={pageIndex + 1} pageCount={model.definition.pages.length} links />
          </div>
        ))}
    </div>
  );
});

export default ReportPageView;
