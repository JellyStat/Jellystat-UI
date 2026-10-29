// Browser rendering of one report element, following the same layout rules as SvgReportRenderer.cs on the
// server: content sits inside the padding, the border is drawn on top, and everything is clipped to the element.
import type { CSSProperties, ReactNode } from "react";
import type { ReportElement, ReportElementStyle, ReportRenderModel, ReportSlice } from "@/lib/models/reports";
import { conditionStyle } from "@/lib/reports/conditions";
import { defaultCardOptions, defaultChartOptions, defaultTableOptions } from "@/lib/reports/defaults";
import { findData, formatValue, resolveLink, resolveTokens } from "@/lib/reports/format";
import { fontWeight } from "@/lib/reports/measure";
import ChartView from "./ChartView";
import MediaImage from "./MediaImage";

export type RenderContext = Pick<ReportRenderModel, "data" | "definition" | "name" | "parameters" | "generatedAt" | "layout">;

interface Props {
  element: ReportElement;
  model: RenderContext;
  pageNumber: number;
  pageCount: number;
  /** Hide the text while it is being edited in place. */
  hideText?: boolean;
  /** Make hyperlinks clickable (the viewer); the designer shows them without following them. */
  links?: boolean;
  /** Growing tables and card grids: the rows this page shows (from model.layout). */
  slice?: ReportSlice | null;
}

const boldWeight = (bold?: boolean | null) => (bold === true ? "bold" : bold === false ? "normal" : undefined);

/** A hyperlink in the viewer, or plain content in the designer (where clicks select elements). */
function Link({ url, enabled, className, children }: { url: string | null; enabled?: boolean; className?: string; children: ReactNode }) {
  if (!url || !enabled) {
    return <>{children}</>;
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={className} style={{ color: "inherit", textDecoration: "inherit" }}>
      {children}
    </a>
  );
}

const dash = (style: string, width: number) =>
  style === "dashed" ? `${width * 4} ${width * 3}` : style === "dotted" ? `${width} ${width * 2}` : undefined;

function textStyle(s: ReportElementStyle, size?: number, weight?: string, color?: string): CSSProperties {
  return {
    fontFamily: s.fontFamily,
    fontSize: size ?? s.fontSize,
    fontWeight: fontWeight(weight ?? s.fontWeight),
    fontStyle: s.italic ? "italic" : "normal",
    color: color ?? s.color,
  };
}

function Message({ text, style, color = "#9ca3af" }: { text: string; style: ReportElementStyle; color?: string }) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center text-center px-2"
      style={{ ...textStyle(style, Math.max(10, Math.min(14, style.fontSize)), "normal", color) }}
    >
      {text}
    </div>
  );
}

const justify = (v: string) => (v === "middle" ? "center" : v === "bottom" ? "flex-end" : "flex-start");

export default function ReportElementView({ element: e, model, pageNumber, pageCount, hideText, links, slice }: Props) {
  const s = e.style;
  let background = !(e.type === "shape" || e.type === "line") && s.background ? s.background : undefined;
  const isShape = e.type === "shape" || e.type === "line";
  const innerW = Math.max(0, e.width - 2 * s.padding);
  const innerH = Math.max(0, e.height - 2 * s.padding);
  let content: ReactNode = null;

  switch (e.type) {
    case "text":
      content = (
        <div
          className="w-full h-full flex flex-col"
          style={{
            justifyContent: justify(s.verticalAlign),
            ...textStyle(s),
            textAlign: s.textAlign,
            lineHeight: s.lineHeight,
            textDecoration: s.underline ? "underline" : undefined,
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
            visibility: hideText ? "hidden" : undefined,
          }}
        >
          <div>{resolveTokens(e.text, model, pageNumber, pageCount)}</div>
        </div>
      );
      break;

    case "metric": {
      const data = findData(model, e.dataSourceId);
      if (data?.error) {
        content = <Message text={data.error} style={s} color="#ef4444" />;
        break;
      }
      const column = data?.columns.find((c) => c.name.toLowerCase() === (e.valueField ?? "").toLowerCase());
      const raw = data && column && data.rows.length > 0 ? data.rows[0][column.name] : null;
      const metricLink =
        e.format === "link" && raw !== null && raw !== undefined ? resolveLink(e.link, raw, data!.rows[0], model, pageNumber, pageCount) : null;
      const cond = data && data.rows.length > 0 ? conditionStyle(e.conditions, data.rows[0], null) : null;
      if (cond?.background) {
        background = cond.background;
      }
      const value = `${e.prefix ?? ""}${raw === null || raw === undefined ? "—" : formatValue(raw, e.format, column?.type, model.definition.timeZone)}${e.suffix ?? ""}`;
      const label = resolveTokens(e.label, model, pageNumber, pageCount);
      const labelSize = Math.max(10, s.fontSize * 0.4);
      content = (
        <div className="w-full h-full flex flex-col" style={{ justifyContent: justify(s.verticalAlign), textAlign: s.textAlign }}>
          {label && (
            <div className="truncate" style={{ ...textStyle(s, labelSize, "normal"), opacity: 0.65, lineHeight: 1.5 }}>
              {label}
            </div>
          )}
          <div
            className="truncate"
            style={{
              ...textStyle(s, undefined, boldWeight(cond?.bold), cond?.color ?? undefined),
              lineHeight: 1.15,
              textDecoration: metricLink ? "underline" : undefined,
            }}
          >
            <Link url={metricLink} enabled={links}>
              {value}
            </Link>
          </div>
        </div>
      );
      break;
    }

    case "table": {
      const t = { ...defaultTableOptions(), ...(e.table ?? {}) };
      const data = findData(model, e.dataSourceId);
      if (!data) {
        content = <Message text="No data source" style={s} />;
        break;
      }
      if (data.error) {
        content = <Message text={data.error} style={s} color="#ef4444" />;
        break;
      }
      const columns = e.columns?.length
        ? e.columns
        : data.columns.map((c) => ({
            field: c.name,
            width: 1,
            align: "left" as const,
            header: null,
            format: null,
          }));
      const total = columns.reduce((a, c) => a + Math.max(0.1, c.width), 0);
      const rowH = Math.max(12, t.rowHeight);
      const headerH = t.showHeader ? rowH : 0;
      // A slice (growing tables) says which rows this page shows; otherwise the rows that fit, from the first
      const fit = Math.floor((innerH - headerH) / rowH);
      const start = slice?.start ?? 0;
      const count = Math.max(
        0,
        Math.min(
          slice?.count ?? Math.min(data.rows.length, Math.max(0, Math.min(fit, t.maxRows ?? Number.MAX_SAFE_INTEGER))),
          data.rows.length - start,
        ),
      );
      const cell = (key: string, text: string, i: number, weight?: string, color?: string, url?: string | null, cellBackground?: string | null) => (
        <div
          key={key}
          className="truncate px-1.5"
          style={{
            width: `${(Math.max(0.1, columns[i].width) / total) * 100}%`,
            textAlign: columns[i].align,
            ...textStyle(s, undefined, weight, color),
            lineHeight: `${rowH}px`,
            textDecoration: url && text ? "underline" : undefined,
            background: cellBackground ?? undefined,
          }}
        >
          <Link url={url ?? null} enabled={links}>
            {text}
          </Link>
        </div>
      );
      content = (
        <div className="w-full h-full">
          {t.showHeader && (
            <div
              className="flex"
              style={{
                height: rowH,
                background: t.headerBackground,
                borderBottom: `1px solid ${t.gridColor}`,
              }}
            >
              {columns.map((c, i) =>
                cell(`h-${i}`, c.header || data.columns.find((x) => x.name === c.field)?.label || c.field, i, "bold", t.headerColor),
              )}
            </div>
          )}
          {data.rows.length === 0 && (
            <div className="relative" style={{ height: Math.min(rowH * 2, innerH - headerH) }}>
              <Message text="No rows" style={s} />
            </div>
          )}
          {data.rows.slice(start, start + count).map((row, n) => {
            const r = start + n;
            const rowStyle = conditionStyle(e.conditions, row, null);
            return (
              <div
                key={r}
                className="flex"
                style={{
                  height: rowH,
                  background: rowStyle?.background ?? (r % 2 === 1 && t.stripeBackground ? t.stripeBackground : undefined),
                  borderBottom: `1px solid ${t.gridColor}`,
                }}
              >
                {columns.map((c, i) => {
                  const cellStyle = conditionStyle(e.conditions, row, c.field);
                  return cell(
                    `c-${r}-${i}`,
                    formatValue(row[c.field], c.format, data.columns.find((x) => x.name === c.field)?.type, model.definition.timeZone),
                    i,
                    boldWeight(cellStyle?.bold ?? rowStyle?.bold),
                    cellStyle?.color ?? rowStyle?.color ?? undefined,
                    c.format === "link" && row[c.field] !== null && row[c.field] !== undefined
                      ? resolveLink(c.link, row[c.field], row, model, pageNumber, pageCount)
                      : null,
                    cellStyle?.background,
                  );
                })}
              </div>
            );
          })}
        </div>
      );
      break;
    }

    case "chart": {
      const chart = { ...defaultChartOptions(), ...(e.chart ?? {}) };
      const data = findData(model, e.dataSourceId);
      if (!data) {
        content = <Message text="No data source" style={s} />;
      } else if (data.error) {
        content = <Message text={data.error} style={s} color="#ef4444" />;
      } else if (chart.series.length === 0 || !chart.categoryField) {
        content = <Message text="Choose a category and at least one series" style={s} />;
      } else if (data.rows.length === 0) {
        content = <Message text="No data" style={s} />;
      } else {
        content = (
          <svg width={innerW} height={innerH} className="block overflow-visible">
            <ChartView chart={chart} data={data} style={s} width={innerW} height={innerH} timeZone={model.definition.timeZone} />
          </svg>
        );
      }
      break;
    }

    case "cards": {
      const o = { ...defaultCardOptions(), ...(e.cards ?? {}) };
      const data = findData(model, e.dataSourceId);
      if (!data) {
        content = <Message text="No data source" style={s} />;
        break;
      }
      if (data.error) {
        content = <Message text={data.error} style={s} color="#ef4444" />;
        break;
      }
      if (data.rows.length === 0) {
        content = <Message text="No rows" style={s} />;
        break;
      }
      // Same grid as SvgReportRenderer.Cards / CardGrid on the server
      const cols = Math.min(24, Math.max(1, Math.round(o.columns)));
      const gap = Math.max(0, o.gap);
      const cardH = Math.max(20, o.cardHeight);
      const cardW = Math.max(1, (innerW - gap * (cols - 1)) / cols);
      const totalRows = Math.min(data.rows.length, Math.max(0, o.maxItems ?? Number.MAX_SAFE_INTEGER));
      const capacity = Math.max(0, Math.floor((innerH + gap) / (cardH + gap))) * cols;
      const start = slice?.start ?? 0;
      const count = Math.max(0, Math.min(slice?.count ?? Math.min(totalRows, capacity), totalRows - start));
      const picture = (o.imagePosition === "top" || o.imagePosition === "left") && !!o.imageField;
      const share = Math.min(0.95, Math.max(0.1, o.imageSize));
      const imageColumn = data.columns.find((c) => c.name.toLowerCase() === (o.imageField ?? "").toLowerCase());
      const small = Math.max(9, s.fontSize * 0.85);
      content = (
        <div className="relative w-full h-full">
          {data.rows.slice(start, start + count).map((row, n) => {
            const r = start + n;
            const cond = conditionStyle(e.conditions, row, null);
            const left = (n % cols) * (cardW + gap);
            const top = Math.floor(n / cols) * (cardH + gap);
            const imageW = picture ? (o.imagePosition === "left" ? cardW * share : cardW) : 0;
            const imageH = picture ? (o.imagePosition === "left" ? cardH : cardH * share) : 0;
            const text = !picture
              ? { x: 10, y: 8, w: cardW - 20, h: cardH - 16 }
              : o.imagePosition === "left"
                ? { x: imageW + 10, y: 8, w: cardW - imageW - 18, h: cardH - 16 }
                : { x: 8, y: imageH + 6, w: cardW - 16, h: cardH - imageH - 12 };
            const lines = [
              { value: o.title, size: s.fontSize, weight: "bold", opacity: 1 },
              { value: o.subtitle, size: small, weight: "normal", opacity: 0.7 },
              { value: o.value, size: s.fontSize, weight: boldWeight(cond?.bold), opacity: 1 },
            ]
              .map((l) => ({ ...l, text: resolveTokens(l.value, model, pageNumber, pageCount, row, data.columns) }))
              .filter((l) => l.text);
            let used = 0;
            const fitting = lines.filter((l) => {
              used += l.size * 1.35;
              return used <= Math.max(0, text.h) + 1;
            });
            const url = e.link?.trim() ? resolveLink(e.link, null, row, model, pageNumber, pageCount) : null;
            const mediaId = imageColumn ? row[imageColumn.name] : null;
            return (
              <div
                key={r}
                className="absolute overflow-hidden"
                style={{
                  left,
                  top,
                  width: cardW,
                  height: cardH,
                  borderRadius: o.cardRadius,
                  background: cond?.background ?? o.cardBackground ?? undefined,
                }}
              >
                <Link url={url} enabled={links} className="block w-full h-full">
                  {picture && (
                    <div className="absolute" style={{ left: 0, top: 0, width: imageW, height: imageH, background: "#e5e7eb" }}>
                      <MediaImage
                        binding={{ type: o.imageKind, imageType: o.imageType, dataSourceId: null, field: null, parameter: null, id: null }}
                        mediaId={mediaId === null || mediaId === undefined ? null : String(mediaId)}
                        model={model}
                        width={imageW}
                        fit="cover"
                        alt=""
                      />
                    </div>
                  )}
                  <div className="absolute" style={{ left: text.x, top: text.y, width: Math.max(0, text.w), textAlign: s.textAlign }}>
                    {fitting.map((l, i) => (
                      <div
                        key={i}
                        className="truncate"
                        style={{
                          ...textStyle(s, l.size, l.weight, cond?.color ?? undefined),
                          opacity: l.opacity,
                          height: l.size * 1.35,
                          lineHeight: `${l.size * 1.35}px`,
                        }}
                      >
                        {l.text}
                      </div>
                    ))}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      );
      break;
    }

    case "image":
      content = e.media ? (
        <MediaImage binding={e.media} model={model} width={innerW} fit={e.fit ?? "contain"} alt={e.name ?? ""} />
      ) : e.src ? (
        <img
          src={e.src}
          alt={e.name ?? ""}
          draggable={false}
          className="w-full h-full block select-none"
          style={{ objectFit: e.fit === "cover" ? "cover" : e.fit === "fill" ? "fill" : "contain" }}
        />
      ) : (
        <div className="w-full h-full relative" style={{ background: "#f3f4f6" }}>
          <Message text="Image" style={s} />
        </div>
      );
      break;

    case "shape": {
      const bw = s.borderWidth > 0 && s.borderColor ? s.borderWidth : 0;
      const half = bw / 2;
      const common = {
        fill: s.background || "none",
        stroke: bw ? (s.borderColor ?? undefined) : undefined,
        strokeWidth: bw || undefined,
        strokeDasharray: bw ? dash(s.borderStyle, bw) : undefined,
      };
      content = (
        <svg width={e.width} height={e.height} className="block">
          {e.shape === "ellipse" ? (
            <ellipse cx={e.width / 2} cy={e.height / 2} rx={Math.max(0, e.width / 2 - half)} ry={Math.max(0, e.height / 2 - half)} {...common} />
          ) : (
            <rect x={half} y={half} width={Math.max(0, e.width - bw)} height={Math.max(0, e.height - bw)} rx={s.borderRadius} {...common} />
          )}
        </svg>
      );
      break;
    }

    case "line": {
      const w = s.borderWidth > 0 ? s.borderWidth : 2;
      const color = s.borderColor || s.color;
      const horizontal = e.width >= e.height;
      content = (
        <svg width={e.width} height={e.height} className="block">
          {horizontal ? (
            <line
              x1={0}
              y1={e.height / 2}
              x2={e.width}
              y2={e.height / 2}
              stroke={color}
              strokeWidth={w}
              strokeDasharray={dash(s.borderStyle, w)}
              strokeLinecap={s.borderStyle === "dotted" ? "round" : undefined}
            />
          ) : (
            <line
              x1={e.width / 2}
              y1={0}
              x2={e.width / 2}
              y2={e.height}
              stroke={color}
              strokeWidth={w}
              strokeDasharray={dash(s.borderStyle, w)}
              strokeLinecap={s.borderStyle === "dotted" ? "round" : undefined}
            />
          )}
        </svg>
      );
      break;
    }
  }

  return (
    <div className="w-full h-full relative" style={{ opacity: Math.min(1, Math.max(0, e.opacity ?? 1)) }}>
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          borderRadius: s.borderRadius,
          background,
          padding: isShape ? 0 : s.padding,
        }}
      >
        <div className="relative w-full h-full">
          {(e.type === "text" || e.type === "image") && e.link?.trim() ? (
            <Link url={resolveLink(e.link, null, null, model, pageNumber, pageCount)} enabled={links} className="block w-full h-full">
              {content}
            </Link>
          ) : (
            content
          )}
        </div>
      </div>
      {!isShape && s.borderWidth > 0 && s.borderColor && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: s.borderRadius,
            border: `${s.borderWidth}px ${s.borderStyle} ${s.borderColor}`,
          }}
        />
      )}
    </div>
  );
}
