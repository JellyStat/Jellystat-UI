import clsx from "clsx";
import { ChevronDown, Download, Loader2, Monitor, RefreshCw, Server } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import client from "@/lib/api";
import type { ReportRenderModel } from "@/lib/models/reports";
import { downloadBlob, exportFileName, exportPdf, exportPng } from "@/lib/reports/clientExport";
import { useReportFonts } from "@/lib/reports/fonts";
import ContextMenu from "./designer/ContextMenu";
import ParameterInput from "./ParameterInput";
import ReportPageView from "./render/ReportPageView";

interface Props {
  reportId: string;
  /** Initial parameter values; the viewer shows a form for the rest. */
  parameters?: Record<string, unknown>;
  /** Hide the parameter form and export menu, e.g. when embedding a report in a dashboard. */
  bare?: boolean;
  /** "client" draws the server's render model in the browser; "server" shows the server-rendered HTML. */
  mode?: "client" | "server";
}

/**
 * Shows a saved report. The server runs the queries (and, in server mode, renders the HTML), so the same output
 * can be placed on any page of the web UI: <ReportViewer reportId="..." bare />.
 */
export default function ReportViewer({ reportId, parameters: initialParameters, bare, mode: initialMode = "client" }: Props) {
  // Re-renders (re-measuring chart and table text) once the report fonts have loaded
  useReportFonts();
  const [model, setModel] = useState<ReportRenderModel | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [mode, setMode] = useState(initialMode);
  const [values, setValues] = useState<Record<string, unknown>>(initialParameters ?? {});
  const [applied, setApplied] = useState<Record<string, unknown>>(initialParameters ?? {});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [scale, setScale] = useState(1);
  const hostRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = Object.fromEntries(Object.entries(applied).filter(([, v]) => v !== undefined && v !== ""));
      if (mode === "server") {
        const blob = await client.Reports.render({ reportId, format: "html", parameters: params });
        setHtml(await blob.text());
        if (!model) {
          setModel(await client.Reports.renderModel({ reportId, parameters: params }));
        }
      } else {
        setModel(await client.Reports.renderModel({ reportId, parameters: params }));
      }
    } catch (err: any) {
      setError(err?.message ?? "Failed to render the report");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId, applied, mode]);

  useEffect(() => {
    void load();
  }, [load]);

  // Scale pages down to fit narrow screens
  useEffect(() => {
    const host = hostRef.current;
    if (!host || !model) {
      return;
    }
    const update = () => setScale(Math.min(1, (host.clientWidth - 2) / model.definition.page.width));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(host);
    return () => ro.disconnect();
  }, [model]);

  const runExport = async (kind: string) => {
    if (!model) {
      return;
    }
    setExporting(true);
    try {
      const params = Object.fromEntries(Object.entries(applied).filter(([, v]) => v !== undefined && v !== ""));
      if (kind === "client-png" || kind === "client-pdf") {
        if (mode !== "client") {
          setMode("client");
          await new Promise((r) => setTimeout(r, 300));
        }
        const nodes = pageRefs.current.filter((n): n is HTMLDivElement => !!n);
        if (kind === "client-png") {
          await exportPng(nodes, exportFileName(model.name, "png"));
        } else {
          await exportPdf(nodes, model.definition.page.width, model.definition.page.height, exportFileName(model.name, "pdf"), model.name);
        }
      } else {
        const format = kind as "pdf" | "png" | "svg" | "html" | "json";
        downloadBlob(await client.Reports.render({ reportId, format, parameters: params }, true), exportFileName(model.name, format));
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const parameters = model?.definition.parameters ?? [];

  return (
    <div className="space-y-4">
      {!bare && (
        <div className="flex flex-wrap items-end gap-3">
          {parameters.map((p) => (
            <label key={p.name} className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{p.label || p.name}</span>
              <ParameterInput
                parameter={p}
                className="w-48"
                source={{ reportId }}
                values={values}
                emptyLabel={p.type === "lookup" ? "All" : "Default"}
                value={p.name in values ? values[p.name] : (p.defaultValue ?? null)}
                onChange={(v) => setValues((s) => ({ ...s, [p.name]: v }))}
              />
            </label>
          ))}
          <button
            type="button"
            onClick={() => (JSON.stringify(values) === JSON.stringify(applied) ? load() : setApplied(values))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-purple/15 border border-brand-purple/40 text-brand-purple hover:bg-brand-purple hover:text-white text-sm font-bold cursor-pointer"
          >
            <RefreshCw size={14} className={clsx(loading && "animate-spin")} /> {parameters.length ? "Apply" : "Refresh"}
          </button>
          <div className="flex-1" />
          <div className="flex rounded-lg border border-border overflow-hidden text-xs font-bold">
            <button
              type="button"
              title="Draw the report in the browser"
              onClick={() => setMode("client")}
              className={clsx(
                "flex items-center gap-1 px-2.5 py-1.5 cursor-pointer",
                mode === "client" ? "bg-surface-hover text-white" : "text-gray-500 hover:text-white",
              )}
            >
              <Monitor size={13} /> Interactive
            </button>
            <button
              type="button"
              title="Show the HTML rendered by the server"
              onClick={() => setMode("server")}
              className={clsx(
                "flex items-center gap-1 px-2.5 py-1.5 cursor-pointer",
                mode === "server" ? "bg-surface-hover text-white" : "text-gray-500 hover:text-white",
              )}
            >
              <Server size={13} /> Server rendered
            </button>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportOpen(!exportOpen)}
              disabled={!model}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-bold text-gray-300 hover:text-white hover:border-gray-500 cursor-pointer disabled:opacity-50"
            >
              {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Export <ChevronDown size={12} />
            </button>
            {exportOpen && hostRef.current && (
              <ContextMenu
                x={Math.max(8, (typeof window !== "undefined" ? window.innerWidth : 1000) - 250)}
                y={(hostRef.current.getBoundingClientRect().top ?? 100) - 4}
                onClose={() => setExportOpen(false)}
                items={[
                  { label: "PNG (in browser)", onClick: () => runExport("client-png") },
                  { label: "PDF (in browser)", onClick: () => runExport("client-pdf") },
                  "separator",
                  { label: "PDF (server, vector)", onClick: () => runExport("pdf") },
                  { label: "PNG (server)", onClick: () => runExport("png") },
                  { label: "SVG (server)", onClick: () => runExport("svg") },
                  { label: "HTML (server)", onClick: () => runExport("html") },
                  { label: "Data as JSON", onClick: () => runExport("json") },
                ]}
              />
            )}
          </div>
        </div>
      )}

      <div ref={hostRef} className="relative min-h-[200px]">
        {loading && !model && (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={32} className="text-brand-purple animate-spin" />
          </div>
        )}
        {error && <div className="p-4 rounded-xl border border-brand-rose/30 bg-brand-rose/5 text-sm text-brand-rose">{error}</div>}

        {model &&
          Object.values(model.data)
            .filter((d) => d.error)
            .map((d) => (
              <div key={d.dataSourceId} className="mb-3 p-3 rounded-lg border border-brand-amber/30 bg-brand-amber/5 text-xs text-brand-amber">
                {model.definition.dataSources.find((s) => s.id === d.dataSourceId)?.name}: {d.error}
              </div>
            ))}

        {model && mode === "client" && (
          <div className={clsx("flex flex-col items-center gap-6 transition-opacity", loading && "opacity-60")}>
            {model.definition.pages.map((p, i) => (
              <div
                key={p.id}
                className="shadow-2xl shadow-black/40 rounded-sm overflow-hidden"
                style={{
                  width: model.definition.page.width * scale,
                  height: model.definition.page.height * scale,
                }}
              >
                <div style={{ transform: `scale(${scale})`, transformOrigin: "0 0" }}>
                  <ReportPageView
                    ref={(n) => {
                      pageRefs.current[i] = n;
                    }}
                    model={model}
                    pageIndex={i}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {mode === "server" && html && (
          // sandbox without scripts: the server HTML is a static document
          <iframe
            title="Server rendered report"
            sandbox=""
            srcDoc={html}
            className={clsx("w-full rounded-xl border border-border bg-[#e5e7eb] transition-opacity", loading && "opacity-60")}
            style={{ height: "80dvh" }}
          />
        )}
      </div>
    </div>
  );
}
