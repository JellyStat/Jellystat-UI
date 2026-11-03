import clsx from "clsx";
import {
  ArrowLeft,
  CalendarClock,
  ChevronDown,
  CircleHelp,
  ClipboardPaste,
  Copy,
  Database,
  Download,
  Eye,
  EyeOff,
  FileJson,
  Files,
  Grid3x3,
  Layers,
  Lock,
  Magnet,
  PanelLeft,
  PanelRight,
  Plus,
  Redo2,
  RefreshCw,
  Save,
  Scissors,
  Trash2,
  Undo2,
  Unlock,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useRouter } from "next/router";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import i18next from "i18next";
import { ConfirmDialog, Spinner } from "@/components/ui";
import client from "@/lib/api";
import type { ReportDataResult, ReportDefinition, ReportImportResult, ReportRenderModel } from "@/lib/models/reports";
import { checkReportFile, downloadReportFile } from "@/lib/reports/transfer";
import ReportImportDialog from "../ReportImportDialog";
import { downloadBlob, exportFileName, exportPdf, exportPng } from "@/lib/reports/clientExport";
import { normalizeDefinition } from "@/lib/reports/defaults";
import { useReportFonts } from "@/lib/reports/fonts";
import HelpDialog from "./HelpDialog";
import { paginate } from "@/lib/reports/layout";
import type { RenderContext } from "../render/ReportElementView";
import ReportPageView, { layoutPages } from "../render/ReportPageView";
import ReportSchedulesDialog from "../ReportSchedulesDialog";
import ContextMenu, { type MenuEntry } from "./ContextMenu";
import { CapabilitiesContext, PreviewDataContext, ToolButton } from "./controls";
import DataPanel from "./DataPanel";
import DesignerCanvas, { PAGE_GUTTER, type ContextMenuRequest } from "./DesignerCanvas";
import { DesignerProvider, useDesigner, type DesignerDoc } from "./designerStore";
import Inspector from "./Inspector";
import LayersPanel from "./LayersPanel";
import PagesPanel from "./PagesPanel";
import Toolbox from "./Toolbox";
import { useTranslation } from "react-i18next";
import { dt } from "./i18n";

type LeftTab = "insert" | "layers" | "pages" | "data";
const ZOOMS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];

const isTyping = (target: EventTarget | null) => {
  const el = target as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
};

/** Runs every data source (debounced) whenever data sources or parameters change, for the live canvas. */
function usePreviewData(definition: ReportDefinition, name: string) {
  const [model, setModel] = useState<ReportRenderModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const key = JSON.stringify({ d: definition.dataSources, p: definition.parameters });

  useEffect(() => {
    if (definition.dataSources.length === 0) {
      setModel(null);
      setError(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        // Pages aren't needed to run the data, and may carry large images
        const data = await client.Reports.preview({
          definition: { ...definition, pages: [{ id: "preview", name: "preview", elements: [] }] },
          name,
          maxRows: 500,
        });
        if (!cancelled) {
          setModel(data);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message ?? dt("reports.designer.errors.preview_failed", "Preview failed"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, nonce]);

  return { model, loading, error, refresh: () => setNonce((n) => n + 1) };
}

function DesignerShell() {
  // Re-renders (re-measuring chart and table text) once the report fonts have loaded
  useReportFonts();
  useTranslation(); // re-render the designer when the language changes
  const router = useRouter();
  const designer = useDesigner();
  const { state, definition, page, selected, dirty, canUndo, canRedo } = designer;
  const [leftTab, setLeftTab] = useState<LeftTab>("insert");
  const [showLeft, setShowLeft] = useState(true);
  const [showRight, setShowRight] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [snap, setSnap] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [importReview, setImportReview] = useState<{ fileName: string; result: ReportImportResult } | null>(null);
  const [saving, setSaving] = useState(false);
  const [menu, setMenu] = useState<(ContextMenuRequest & { items: MenuEntry[] }) | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [showSchedules, setShowSchedules] = useState(false);
  const canvasHost = useRef<HTMLDivElement>(null);
  const exportRefs = useRef<(HTMLDivElement | null)[]>([]);
  const importRef = useRef<HTMLInputElement>(null);

  const preview = usePreviewData(definition, state.doc.name);
  const renderModel = useMemo(() => {
    const model: RenderContext = {
      definition,
      name: state.doc.name || "Untitled report",
      data: (preview.model?.data ?? {}) as Record<string, ReportDataResult>,
      parameters: preview.model?.parameters ?? Object.fromEntries(definition.parameters.map((p) => [p.name, p.defaultValue ?? null])),
      generatedAt: preview.model?.generatedAt ?? new Date().toISOString(),
    };
    // The preview data is fetched without pages, so the page flow is worked out here (same rules as the server)
    return { ...model, layout: paginate(model) };
  }, [definition, state.doc.name, preview.model]);

  // ---------------------------------------------------------------- zoom

  const fitWidth = useCallback(() => {
    const w = canvasHost.current?.clientWidth ?? 1000;
    setZoom(Math.max(0.1, Math.min(4, Math.floor(((w - PAGE_GUTTER * 2) / definition.page.width) * 100) / 100)));
  }, [definition.page.width]);

  const fitPage = useCallback(() => {
    const w = canvasHost.current?.clientWidth ?? 1000;
    const h = canvasHost.current?.clientHeight ?? 800;
    setZoom(
      Math.max(
        0.1,
        Math.min(4, Math.floor(Math.min((w - PAGE_GUTTER * 2) / definition.page.width, (h - PAGE_GUTTER * 2) / definition.page.height) * 100) / 100),
      ),
    );
  }, [definition.page.width, definition.page.height]);

  const fitted = useRef(false);
  useEffect(() => {
    if (!fitted.current && canvasHost.current) {
      fitted.current = true;
      fitWidth();
    }
  }, [fitWidth]);

  const zoomStep = (dir: 1 | -1) => {
    const next = dir > 0 ? ZOOMS.find((z) => z > zoom + 0.001) : [...ZOOMS].reverse().find((z) => z < zoom - 0.001);
    setZoom(next ?? zoom);
  };

  // ---------------------------------------------------------------- save / leave

  const save = useCallback(async () => {
    const name = state.doc.name.trim();
    if (!name) {
      toast.error(i18next.t("errors.give_the_report_a_name_first_report", "Give the report a name first (Report section, with nothing selected)"));
      return;
    }
    setSaving(true);
    try {
      const saved = await client.Reports.save({
        id: state.doc.id,
        name,
        description: state.doc.description || null,
        definition,
      });
      designer.markSaved(saved.id);
      toast.success(i18next.t("reports.designer_saved", "Report saved"));
      if (router.query.id !== saved.id) {
        void router.replace({ pathname: "/reports/designer", query: { id: saved.id } }, undefined, {
          shallow: true,
        });
      }
    } catch (err: any) {
      toast.error(err?.message ?? i18next.t("errors.failed_to_save_the_report", "Failed to save the report"));
    } finally {
      setSaving(false);
    }
  }, [state.doc, definition, designer, router]);

  useEffect(() => {
    if (!dirty) {
      return;
    }
    const warn = (ev: BeforeUnloadEvent) => {
      ev.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const leave = () => {
    if (dirty) {
      setConfirmLeave(true);
    } else {
      void router.push("/reports");
    }
  };

  // ---------------------------------------------------------------- keyboard

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (isTyping(ev.target)) {
        return;
      }
      const mod = ev.ctrlKey || ev.metaKey;
      const key = ev.key.toLowerCase();
      const handled = () => ev.preventDefault();

      if (key === "?" || key === "f1") {
        handled();
        setShowHelp(true);
      } else if (mod && key === "s") {
        handled();
        void save();
      } else if (mod && key === "z" && !ev.shiftKey) {
        handled();
        designer.undo();
      } else if (mod && (key === "y" || (key === "z" && ev.shiftKey))) {
        handled();
        designer.redo();
      } else if (mod && key === "c") {
        designer.copy();
      } else if (mod && key === "x") {
        designer.cut();
      } else if (mod && key === "v") {
        handled();
        designer.paste();
      } else if (mod && key === "d") {
        handled();
        designer.duplicate();
      } else if (mod && key === "a") {
        handled();
        designer.select(page.elements.filter((e) => !e.hidden).map((e) => e.id));
      } else if (mod && (key === "]" || key === "}")) {
        handled();
        designer.reorder(ev.shiftKey ? "front" : "forward");
      } else if (mod && (key === "[" || key === "{")) {
        handled();
        designer.reorder(ev.shiftKey ? "back" : "backward");
      } else if (mod && (key === "=" || key === "+")) {
        handled();
        zoomStep(1);
      } else if (mod && key === "-") {
        handled();
        zoomStep(-1);
      } else if (mod && key === "0") {
        handled();
        fitPage();
      } else if (key === "delete" || key === "backspace") {
        if (state.selection.length) {
          handled();
          designer.deleteSelection();
        }
      } else if (key === "escape") {
        designer.select([]);
        setPreviewMode(false);
      } else if (key.startsWith("arrow") && state.selection.length) {
        handled();
        const step = ev.shiftKey ? 10 : 1;
        designer.nudge(key === "arrowleft" ? -step : key === "arrowright" ? step : 0, key === "arrowup" ? -step : key === "arrowdown" ? step : 0);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ---------------------------------------------------------------- context menu

  const openMenu = (req: ContextMenuRequest) => {
    const has = state.selection.length > 0 || req.onElement;
    const locked = selected.length > 0 && selected.every((e) => e.locked);
    const items: MenuEntry[] = has
      ? [
          { label: dt("reports.designer.cut", "Cut"), shortcut: "Ctrl+X", icon: <Scissors size={13} />, onClick: designer.cut },
          { label: dt("common.copy", "Copy"), shortcut: "Ctrl+C", icon: <Copy size={13} />, onClick: designer.copy },
          {
            label: dt("reports.designer.paste", "Paste"),
            shortcut: "Ctrl+V",
            icon: <ClipboardPaste size={13} />,
            onClick: () => designer.paste({ x: req.pageX, y: req.pageY }),
          },
          {
            label: dt("common.duplicate", "Duplicate"),
            shortcut: "Ctrl+D",
            icon: <Files size={13} />,
            onClick: designer.duplicate,
          },
          "separator",
          {
            label: dt("reports.designer.bring_to_front", "Bring to front"),
            shortcut: "Ctrl+Shift+]",
            onClick: () => designer.reorder("front"),
          },
          {
            label: dt("reports.designer.bring_forward", "Bring forward"),
            shortcut: "Ctrl+]",
            onClick: () => designer.reorder("forward"),
          },
          {
            label: dt("reports.designer.send_backward", "Send backward"),
            shortcut: "Ctrl+[",
            onClick: () => designer.reorder("backward"),
          },
          {
            label: dt("reports.designer.send_to_back", "Send to back"),
            shortcut: "Ctrl+Shift+[",
            onClick: () => designer.reorder("back"),
          },
          "separator",
          {
            label: locked ? dt("reports.designer.unlock", "Unlock") : dt("reports.designer.lock", "Lock"),
            icon: locked ? <Unlock size={13} /> : <Lock size={13} />,
            onClick: () =>
              designer.updateElements(state.selection, (e) => {
                e.locked = !locked;
              }),
          },
          {
            label: dt("reports.designer.hide", "Hide"),
            icon: <EyeOff size={13} />,
            onClick: () =>
              designer.updateElements(state.selection, (e) => {
                e.hidden = true;
              }),
          },
          {
            label: dt("common.delete", "Delete"),
            shortcut: "Del",
            icon: <Trash2 size={13} />,
            danger: true,
            onClick: designer.deleteSelection,
          },
        ]
      : [
          {
            label: dt("reports.designer.paste_here", "Paste here"),
            shortcut: "Ctrl+V",
            icon: <ClipboardPaste size={13} />,
            onClick: () => designer.paste({ x: req.pageX, y: req.pageY }),
          },
          {
            label: dt("reports.designer.select_all", "Select all"),
            shortcut: "Ctrl+A",
            onClick: () => designer.select(page.elements.filter((e) => !e.hidden).map((e) => e.id)),
          },
          "separator",
          {
            label: dt("reports.designer.show_hidden_elements", "Show hidden elements"),
            icon: <Eye size={13} />,
            disabled: !page.elements.some((e) => e.hidden),
            onClick: () =>
              designer.updateElements(
                page.elements.map((e) => e.id),
                (e) => {
                  e.hidden = false;
                },
              ),
          },
          { label: dt("reports.designer.add_page", "Add page"), icon: <Plus size={13} />, onClick: designer.addPage },
        ];
    setMenu({ ...req, items });
  };

  // ---------------------------------------------------------------- export / import

  const runExport = async (kind: string) => {
    setExportOpen(false);
    setExporting(kind);
    const name = state.doc.name || "report";
    // Growing tables and card grids add pages, so "this page" is found in the drawn pages
    const thisPage = Math.max(
      0,
      layoutPages(renderModel).findIndex((p) => p.page === state.pageIndex && p.continuation === 0),
    );
    try {
      if (kind === "client-png" || kind === "client-pdf") {
        // Off-screen 1:1 pages (no selection chrome) are rendered while exporting is set; wait a frame for them
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const nodes = exportRefs.current.filter((n): n is HTMLDivElement => !!n);
        if (kind === "client-png") {
          await exportPng([nodes[thisPage]], exportFileName(name, "png"));
        } else {
          await exportPdf(nodes, definition.page.width, definition.page.height, exportFileName(name, "pdf"), name);
        }
      } else if (kind === "definition") {
        downloadReportFile(name, state.doc.description, definition);
      } else {
        const format = kind.replace("server-", "") as "pdf" | "png" | "svg" | "html" | "json";
        const blob = await client.Reports.render(
          {
            definition,
            name,
            format,
            page: format === "png" || format === "svg" ? thisPage + 1 : null,
            scale: 2,
          },
          true,
        );
        downloadBlob(blob, exportFileName(name, format));
      }
    } catch (err: any) {
      toast.error(err?.message ?? i18next.t("errors.export_failed", "Export failed"));
    } finally {
      setExporting(null);
    }
  };

  const applyImport = (result: ReportImportResult) => {
    setImportReview(null);
    const def = normalizeDefinition(result.definition!);
    designer.change(
      (doc) => {
        doc.definition = def;
        if (result.name && !doc.name) {
          doc.name = result.name;
        }
        if (result.description && !doc.description) {
          doc.description = result.description;
        }
      },
      { pageIndex: 0, selection: [] },
    );
    toast.success(i18next.t("reports.designer_imported", "Report definition imported"));
  };

  const importDefinition = async (file: File) => {
    try {
      const result = await checkReportFile(file);
      if (result.valid && result.warnings.length === 0) {
        applyImport(result);
      } else {
        setImportReview({ fileName: file.name, result });
      }
    } catch (err: any) {
      toast.error(err?.message ?? i18next.t("errors.failed_to_check_the_file", "Failed to check the file"));
    }
  };

  // ---------------------------------------------------------------- render

  const tabs: { key: LeftTab; label: string; icon: typeof Plus }[] = [
    { key: "insert", label: dt("reports.designer.insert", "Insert"), icon: Plus },
    { key: "layers", label: dt("reports.designer.layers", "Layers"), icon: Layers },
    { key: "pages", label: dt("reports.designer.pages", "Pages"), icon: Files },
    { key: "data", label: dt("reports.designer.data", "Data"), icon: Database },
  ];
  const dataErrors = Object.values(preview.model?.data ?? {}).filter((d) => d.error).length;

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background text-gray-200">
      {/* Toolbar */}
      <div className="h-12 shrink-0 flex items-center gap-1 px-2 border-b border-border bg-surface overflow-x-auto">
        <ToolButton title={dt("common.back_to_reports", "Back to reports")} onClick={leave}>
          <ArrowLeft size={17} />
        </ToolButton>
        <input
          value={state.doc.name}
          placeholder={dt("reports.designer.untitled_report", "Untitled report")}
          onChange={(ev) =>
            designer.change(
              (doc) => {
                doc.name = ev.target.value;
              },
              { coalesceKey: "report-name" },
            )
          }
          className="w-40 sm:w-56 bg-transparent border border-transparent hover:border-border focus:border-primary rounded-md px-2 py-1 text-sm font-bold text-white outline-none"
        />
        {dirty && <span className="text-xs text-warning shrink-0">{dt("reports.designer.unsaved", "unsaved")}</span>}
        <div className="w-px h-6 bg-border mx-1 shrink-0" />
        <ToolButton title={dt("reports.designer.toggle_left_panel", "Toggle left panel")} onClick={() => setShowLeft(!showLeft)} active={showLeft}>
          <PanelLeft size={16} />
        </ToolButton>
        <ToolButton title={dt("reports.designer.undo_ctrl_z", "Undo (Ctrl+Z)")} onClick={designer.undo} disabled={!canUndo}>
          <Undo2 size={16} />
        </ToolButton>
        <ToolButton title={dt("reports.designer.redo_ctrl_y", "Redo (Ctrl+Y)")} onClick={designer.redo} disabled={!canRedo}>
          <Redo2 size={16} />
        </ToolButton>
        <div className="w-px h-6 bg-border mx-1 shrink-0" />
        <ToolButton title={dt("reports.designer.zoom_out_ctrl", "Zoom out (Ctrl+-)")} onClick={() => zoomStep(-1)}>
          <ZoomOut size={16} />
        </ToolButton>
        <select
          value={String(zoom)}
          onChange={(ev) => {
            if (ev.target.value === "fit-width") {
              fitWidth();
            } else if (ev.target.value === "fit-page") {
              fitPage();
            } else {
              setZoom(Number(ev.target.value));
            }
          }}
          className="bg-background border border-border rounded-md px-1 py-1 text-xs text-gray-300 outline-none cursor-pointer shrink-0"
        >
          {!ZOOMS.includes(zoom) && <option value={String(zoom)}>{Math.round(zoom * 100)}%</option>}
          {ZOOMS.map((z) => (
            <option key={z} value={String(z)}>
              {Math.round(z * 100)}%
            </option>
          ))}
          <option value="fit-width">{dt("reports.designer.fit_width", "Fit width")}</option>
          <option value="fit-page">{dt("reports.designer.fit_page_ctrl_0", "Fit page (Ctrl+0)")}</option>
        </select>
        <ToolButton title={dt("reports.designer.zoom_in_ctrl", "Zoom in (Ctrl+=)")} onClick={() => zoomStep(1)}>
          <ZoomIn size={16} />
        </ToolButton>
        <ToolButton title={dt("reports.designer.show_grid_snap_to_grid", "Show grid (snap to grid)")} onClick={() => setShowGrid(!showGrid)} active={showGrid}>
          <Grid3x3 size={16} />
        </ToolButton>
        <ToolButton title={dt("reports.designer.snap_to_guides_and_grid_hold_alt_to_move_freely", "Snap to guides and grid (hold Alt to move freely)")} onClick={() => setSnap(!snap)} active={snap}>
          <Magnet size={16} />
        </ToolButton>
        <ToolButton title={dt("reports.designer.preview", "Preview")} onClick={() => setPreviewMode(!previewMode)} active={previewMode}>
          <Eye size={16} />
        </ToolButton>
        <ToolButton title={dt("reports.designer.refresh_data", "Refresh data")} onClick={preview.refresh}>
          <RefreshCw size={16} className={clsx(preview.loading && "animate-spin")} />
        </ToolButton>
        <ToolButton title={dt("reports.designer.help_placeholders_formats_page_flow_and_shortcut", "Help: placeholders, formats, page flow and shortcuts (?)")} onClick={() => setShowHelp(true)}>
          <CircleHelp size={16} />
        </ToolButton>
        <div className="flex-1" />
        {state.doc.id && (
          <ToolButton title={dt("common.schedules_and_webhooks", "Schedules & webhooks")} onClick={() => setShowSchedules(true)}>
            <CalendarClock size={16} />
          </ToolButton>
        )}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setExportOpen(!exportOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-bold text-gray-300 hover:text-white hover:border-gray-500 cursor-pointer"
          >
            {exporting ? <Spinner size={14} className="" /> : <Download size={14} />} {dt("common.export", "Export")} <ChevronDown size={12} />
          </button>
          {exportOpen && (
            <ContextMenu
              x={typeof window !== "undefined" ? window.innerWidth - 240 : 0}
              y={48}
              onClose={() => setExportOpen(false)}
              items={[
                { label: dt("reports.designer.png_of_this_page_in_browser", "PNG of this page (in browser)"), onClick: () => runExport("client-png") },
                { label: dt("reports.designer.pdf_of_all_pages_in_browser", "PDF of all pages (in browser)"), onClick: () => runExport("client-pdf") },
                "separator",
                { label: dt("reports.designer.pdf_server_vector", "PDF (server, vector)"), onClick: () => runExport("server-pdf") },
                { label: dt("reports.designer.png_of_this_page_server", "PNG of this page (server)"), onClick: () => runExport("server-png") },
                { label: dt("reports.designer.svg_of_this_page_server", "SVG of this page (server)"), onClick: () => runExport("server-svg") },
                { label: dt("reports.designer.html_server", "HTML (server)"), onClick: () => runExport("server-html") },
                { label: dt("reports.designer.data_as_json_server", "Data as JSON (server)"), onClick: () => runExport("server-json") },
                "separator",
                {
                  label: dt("reports.designer.report_definition_json", "Report definition (.json)"),
                  icon: <FileJson size={13} />,
                  onClick: () => runExport("definition"),
                },
                {
                  label: dt("reports.designer.import_definition", "Import definition..."),
                  icon: <Upload size={13} />,
                  onClick: () => importRef.current?.click(),
                },
              ]}
            />
          )}
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-solid text-white text-xs font-bold hover:bg-primary-solid-hover cursor-pointer disabled:opacity-50 shrink-0"
        >
          {saving ? <Spinner size={14} className="" /> : <Save size={14} />} {dt("common.save", "Save")}
        </button>
        <ToolButton title={dt("reports.designer.toggle_right_panel", "Toggle right panel")} onClick={() => setShowRight(!showRight)} active={showRight}>
          <PanelRight size={16} />
        </ToolButton>
        <input
          ref={importRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(ev) => {
            const file = ev.target.files?.[0];
            ev.target.value = "";
            if (file) {
              void importDefinition(file);
            }
          }}
        />
      </div>

      <div className="flex-1 min-h-0 flex">
        {/* Left panel */}
        {showLeft && !previewMode && (
          <div className="w-64 shrink-0 flex flex-col border-r border-border bg-surface">
            <div className="grid grid-cols-4 border-b border-border">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setLeftTab(t.key)}
                  className={clsx(
                    "flex flex-col items-center gap-0.5 py-2 text-xs font-bold cursor-pointer border-b-2",
                    leftTab === t.key ? "text-primary-soft border-primary" : "text-gray-500 border-transparent hover:text-gray-200",
                  )}
                >
                  <t.icon size={15} />
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto">
              {leftTab === "insert" && <Toolbox />}
              {leftTab === "layers" && <LayersPanel />}
              {leftTab === "pages" && <PagesPanel />}
              {leftTab === "data" && <DataPanel data={preview.model?.data ?? {}} />}
            </div>
          </div>
        )}

        {/* Canvas */}
        <div ref={canvasHost} className="flex-1 min-w-0 flex flex-col">
          {previewMode ? (
            <div className="flex-1 overflow-auto bg-background p-10 flex flex-col items-center gap-8">
              {layoutPages(renderModel).map((p, i) => (
                <div
                  key={`${p.page}-${p.continuation}`}
                  className="shadow-2xl shadow-black/60"
                  style={{
                    width: definition.page.width * zoom,
                    height: definition.page.height * zoom,
                  }}
                >
                  <div style={{ transform: `scale(${zoom})`, transformOrigin: "0 0" }}>
                    <ReportPageView model={renderModel} pageIndex={i} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <DesignerCanvas model={renderModel} settings={{ zoom, setZoom, snap, showGrid, gridSize: 8 }} onContextMenu={openMenu} />
          )}
          {/* Status bar */}
          <div className="h-7 shrink-0 flex items-center gap-4 px-3 border-t border-border bg-surface text-xs text-gray-500">
            <span>
              {dt("reports.designer.page_n_of_m", "Page {{n}} of {{m}}", { n: state.pageIndex + 1, m: definition.pages.length })}
            </span>
            <span>
              {definition.page.width} × {definition.page.height}
            </span>
            {selected.length > 0 && <span>{dt("reports.designer.n_selected", "{{n}} selected", { n: selected.length })}</span>}
            <div className="flex-1" />
            {preview.loading && (
              <span className="flex items-center gap-1">
                <Spinner size={11} className="" /> {dt("reports.designer.loading_data", "Loading data")}
              </span>
            )}
            {preview.error && <span className="text-danger truncate">{preview.error}</span>}
            {dataErrors > 0 && <span className="text-danger">{dataErrors} data source error(s): see the Data tab</span>}
            {definition.pages.length > 1 && (
              <div className="flex gap-1">
                {definition.pages.map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    title={p.name}
                    onClick={() => designer.setPage(i)}
                    className={clsx(
                      "w-5 h-5 rounded text-xs cursor-pointer",
                      i === state.pageIndex ? "bg-primary-solid text-white" : "hover:bg-surface-hover",
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Inspector */}
        {showRight && !previewMode && (
          <div className="w-72 shrink-0 border-l border-border bg-surface overflow-y-auto">
            <PreviewDataContext.Provider value={preview.model?.data ?? {}}>
              <Inspector />
            </PreviewDataContext.Provider>
          </div>
        )}
      </div>

      {menu && <ContextMenu x={menu.clientX} y={menu.clientY} items={menu.items} onClose={() => setMenu(null)} />}

      {/* 1:1 pages for in-browser export, rendered only while exporting */}
      {(exporting === "client-png" || exporting === "client-pdf") && (
        <div aria-hidden className="fixed pointer-events-none" style={{ left: -100000, top: 0 }}>
          {layoutPages(renderModel).map((p, i) => (
            <ReportPageView
              key={`${p.page}-${p.continuation}`}
              ref={(n) => {
                exportRefs.current[i] = n;
              }}
              model={renderModel}
              pageIndex={i}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmLeave}
        title={dt("reports.designer.leave_without_saving", "Leave without saving?")}
        description={dt("reports.designer.your_changes_to_this_report_haven_t_been_saved", "Your changes to this report haven't been saved.")}
        confirmText={dt("reports.designer.leave", "Leave")}
        cancelText={dt("reports.designer.stay", "Stay")}
        tone="danger"
        onResult={(yes) => {
          setConfirmLeave(false);
          if (yes) {
            void router.push("/reports");
          }
        }}
      />

      {showHelp && <HelpDialog onClose={() => setShowHelp(false)} />}

      {importReview && (
        <ReportImportDialog
          fileName={importReview.fileName}
          result={importReview.result}
          onImport={() => applyImport(importReview.result)}
          onClose={() => setImportReview(null)}
        />
      )}

      {showSchedules && state.doc.id && (
        <ReportSchedulesDialog
          reportId={state.doc.id}
          reportName={state.doc.name}
          parameters={definition.parameters}
          onClose={() => setShowSchedules(false)}
        />
      )}
    </div>
  );
}

export default function ReportDesigner({ initial }: { initial: DesignerDoc }) {
  const [caps, setCaps] = useState<Awaited<ReturnType<typeof client.Reports.capabilities>> | null>(null);
  useEffect(() => {
    client.Reports.capabilities()
      .then(setCaps)
      .catch((err) => toast.error(err?.message ?? i18next.t("errors.failed_to_load_report_fields", "Failed to load report fields")));
  }, []);

  // Rendered on <body> so the full-screen designer sits above the app's side nav and page layout
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return null;
  }

  return createPortal(
    <CapabilitiesContext.Provider value={caps}>
      <DesignerProvider initial={initial}>
        <DesignerShell />
      </DesignerProvider>
    </CapabilitiesContext.Provider>,
    document.body,
  );
}
