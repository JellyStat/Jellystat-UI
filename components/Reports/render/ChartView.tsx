// Port of the chart drawing in SvgReportRenderer.cs, so charts look the same in the designer and in server
// exports. Coordinates are relative to the element's content box. Change both together.
import type { ReactNode } from "react";
import type { ReportChartOptions, ReportDataResult, ReportElementStyle } from "@/lib/models/reports";
import { DEFAULT_PALETTE } from "@/lib/reports/defaults";
import { formatValue, toNumber } from "@/lib/reports/format";
import { ellipsis, fontWeight, measureText } from "@/lib/reports/measure";

interface Props {
  chart: ReportChartOptions;
  data: ReportDataResult;
  style: ReportElementStyle;
  width: number;
  height: number;
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function niceTicks(min: number, max: number, count: number): number[] {
  let hi = max;
  if (hi <= min) {
    hi = min + 1;
  }
  const raw = (hi - min) / Math.max(1, count - 1);
  const exp = Math.floor(Math.log10(raw));
  const f = raw / 10 ** exp;
  const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  const step = nf * 10 ** exp;
  const lo = Math.floor(min / step) * step;
  const top = Math.ceil(hi / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= top + step / 2; v += step) {
    ticks.push(Math.round(v * 1e10) / 1e10);
  }
  return ticks;
}

export function arcPath(cx: number, cy: number, r: number, inner: number, a0: number, a1In: number): string {
  const a1 = a1In - a0 >= Math.PI * 2 - 0.0001 ? a0 + Math.PI * 2 - 0.0001 : a1In;
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const p = (rad: number, a: number) => `${cx + Math.cos(a) * rad},${cy + Math.sin(a) * rad}`;
  if (inner <= 0) {
    return `M${p(0, 0)} L${p(r, a0)} A${r},${r} 0 ${large} 1 ${p(r, a1)} Z`;
  }
  return `M${p(r, a0)} A${r},${r} 0 ${large} 1 ${p(r, a1)} L${p(inner, a1)} A${inner},${inner} 0 ${large} 0 ${p(inner, a0)} Z`;
}

export default function ChartView({ chart: c, data, style: s, width, height }: Props) {
  const palette = c.palette?.length ? c.palette : DEFAULT_PALETTE;
  const categoryType = data.columns.find((x) => x.name === c.categoryField)?.type;
  const categories = data.rows.map((r) => formatValue(r[c.categoryField ?? ""], c.categoryFormat, categoryType));
  const series = c.series.map((sr, i) => ({
    name: sr.label || data.columns.find((x) => x.name === sr.field)?.label || sr.field,
    color: sr.color || palette[i % palette.length],
    values: data.rows.map((r) => toNumber(r[sr.field]) ?? 0),
    type: data.columns.find((x) => x.name === sr.field)?.type,
  }));
  const valueType = series[0]?.type;
  const fmt = (v: number) => formatValue(v, c.valueFormat, valueType);
  const axisFont = Math.max(9, s.fontSize * 0.8);
  const textProps = { fontFamily: s.fontFamily, fontStyle: s.italic ? "italic" : undefined };

  const label = (
    key: string,
    text: string,
    x: number,
    cy: number,
    anchor: "start" | "middle" | "end",
    size: number,
    color: string,
    weight = "normal",
  ) => (
    <text key={key} x={x} y={cy + size * 0.35} textAnchor={anchor} fontSize={size} fontWeight={fontWeight(weight)} fill={color} {...textProps}>
      {text}
    </text>
  );

  const out: ReactNode[] = [];
  let b: Box = { x: 0, y: 0, w: width, h: height };
  const pie = c.kind === "pie" || c.kind === "donut";

  if (c.showLegend && (series.length > 1 || pie)) {
    const items = pie
      ? categories.map((cat, i) => ({ name: cat, color: palette[i % palette.length] }))
      : series.map((sr) => ({ name: sr.name, color: sr.color }));
    let lx = b.x;
    const ly = b.y + axisFont / 2 + 2;
    for (let i = 0; i < items.length; i++) {
      const text = ellipsis(items[i].name, 120, s, axisFont);
      const w = 14 + measureText(text, s, axisFont) + 12;
      if (lx + w > b.x + b.w && lx > b.x) {
        break;
      }
      out.push(<rect key={`lg-${i}`} x={lx} y={ly - 5} width={10} height={10} rx={2} fill={items[i].color} />);
      out.push(label(`lgt-${i}`, text, lx + 14, ly, "start", axisFont, c.axisColor));
      lx += w;
    }
    const legendH = axisFont + 10;
    b = { x: b.x, y: b.y + legendH, w: b.w, h: Math.max(0, b.h - legendH) };
  }

  if (pie) {
    const values = series[0].values;
    const total = values.filter((v) => v > 0).reduce((a, v) => a + v, 0);
    if (total <= 0) {
      return null;
    }
    const r = Math.max(1, Math.min(b.w, b.h) / 2 - 4);
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    const inner = c.kind === "donut" ? r * 0.6 : 0;
    let angle = -Math.PI / 2;
    values.forEach((v, i) => {
      if (v <= 0) {
        return;
      }
      const sweep = (v / total) * Math.PI * 2;
      out.push(
        <path
          key={`sl-${i}`}
          d={arcPath(cx, cy, r, inner, angle, angle + sweep)}
          fill={palette[i % palette.length]}
          stroke="#ffffff"
          strokeWidth={1}
        />,
      );
      if (c.showValues && v / total >= 0.05) {
        const mid = angle + sweep / 2;
        const lr = inner > 0 ? (r + inner) / 2 : r * 0.62;
        out.push(
          label(
            `slv-${i}`,
            `${Math.round((v / total) * 100)}%`,
            cx + Math.cos(mid) * lr,
            cy + Math.sin(mid) * lr,
            "middle",
            axisFont,
            "#ffffff",
            "bold",
          ),
        );
      }
      angle += sweep;
    });
    return <>{out}</>;
  }

  const horizontal = c.kind === "horizontalBar";
  const stacked = c.stacked && (c.kind === "bar" || c.kind === "horizontalBar" || c.kind === "area");
  const n = categories.length;
  let max = 0;
  let min = 0;
  for (let i = 0; i < n; i++) {
    if (stacked) {
      max = Math.max(
        max,
        series.reduce((a, sr) => a + Math.max(0, sr.values[i]), 0),
      );
      min = Math.min(
        min,
        series.reduce((a, sr) => a + Math.min(0, sr.values[i]), 0),
      );
    } else {
      for (const sr of series) {
        max = Math.max(max, sr.values[i]);
        min = Math.min(min, sr.values[i]);
      }
    }
  }
  const ticks = niceTicks(min, max, 5);
  const lo = ticks[0];
  const hi = ticks[ticks.length - 1];
  const tickLabels = ticks.map(fmt);
  const valueLabelW = c.showAxes ? Math.max(...tickLabels.map((t) => measureText(t, s, axisFont))) + 8 : 0;
  const categoryLabelW = horizontal && c.showAxes ? Math.min(b.w * 0.4, Math.max(...categories.map((cat) => measureText(cat, s, axisFont))) + 8) : 0;
  const bottom = c.showAxes ? axisFont + 10 : 0;
  const topPad = c.showValues ? axisFont + 4 : 4;
  const plot: Box = horizontal
    ? {
        x: b.x + categoryLabelW,
        y: b.y + 4,
        w: Math.max(1, b.w - categoryLabelW - 12),
        h: Math.max(1, b.h - bottom - 4),
      }
    : {
        x: b.x + valueLabelW,
        y: b.y + topPad,
        w: Math.max(1, b.w - valueLabelW - 8),
        h: Math.max(1, b.h - bottom - topPad),
      };
  const scale = (v: number) => (horizontal ? plot.x + ((v - lo) / (hi - lo)) * plot.w : plot.y + plot.h - ((v - lo) / (hi - lo)) * plot.h);
  const hLine = (key: string, x1: number, x2: number, y: number, color: string) => (
    <line key={key} x1={x1} y1={y} x2={x2} y2={y} stroke={color} strokeWidth={1} />
  );

  ticks.forEach((t, i) => {
    const p = scale(t);
    if (c.showGrid) {
      out.push(
        horizontal ? (
          <line key={`g-${i}`} x1={p} y1={plot.y} x2={p} y2={plot.y + plot.h} stroke={c.gridColor} strokeWidth={1} />
        ) : (
          hLine(`g-${i}`, plot.x, plot.x + plot.w, p, c.gridColor)
        ),
      );
    }
    if (c.showAxes) {
      out.push(
        horizontal
          ? label(`t-${i}`, tickLabels[i], p, plot.y + plot.h + bottom / 2 + 2, "middle", axisFont, c.axisColor)
          : label(`t-${i}`, tickLabels[i], plot.x - 6, p, "end", axisFont, c.axisColor),
      );
    }
  });

  const band = (horizontal ? plot.h : plot.w) / Math.max(1, n);
  if (c.showAxes) {
    if (horizontal) {
      categories.forEach((cat, i) => {
        out.push(
          label(`c-${i}`, ellipsis(cat, categoryLabelW - 8, s, axisFont), plot.x - 6, plot.y + band * (i + 0.5), "end", axisFont, c.axisColor),
        );
      });
    } else {
      const widest = Math.max(...categories.map((cat) => measureText(cat, s, axisFont)));
      const every = Math.max(1, Math.ceil(Math.min(widest + 8, 140) / band));
      for (let i = 0; i < n; i += every) {
        out.push(
          label(
            `c-${i}`,
            ellipsis(categories[i], band * every - 4, s, axisFont),
            plot.x + band * (i + 0.5),
            plot.y + plot.h + bottom / 2 + 2,
            "middle",
            axisFont,
            c.axisColor,
          ),
        );
      }
    }
    const axisAt = scale(Math.max(lo, 0));
    out.push(
      horizontal ? (
        <line key="axis" x1={axisAt} y1={plot.y} x2={axisAt} y2={plot.y + plot.h} stroke={c.axisColor} strokeWidth={1} />
      ) : (
        hLine("axis", plot.x, plot.x + plot.w, axisAt, c.axisColor)
      ),
    );
  }

  const zero = scale(Math.max(lo, Math.min(0, hi)));
  if (c.kind === "bar" || c.kind === "horizontalBar") {
    const inner = band * 0.8;
    const barW = stacked ? inner : inner / series.length;
    for (let i = 0; i < n; i++) {
      let posBase = 0;
      let negBase = 0;
      series.forEach((sr, k) => {
        const v = sr.values[i];
        let from = 0;
        let to = v;
        if (stacked) {
          from = v >= 0 ? posBase : negBase;
          to = from + v;
          if (v >= 0) {
            posBase = to;
          } else {
            negBase = to;
          }
        }
        const a = scale(from);
        const z = scale(to);
        const offset = band * 0.1 + (stacked ? 0 : k * barW);
        out.push(
          horizontal ? (
            <rect
              key={`b-${i}-${k}`}
              x={Math.min(a, z)}
              y={plot.y + band * i + offset}
              width={Math.abs(z - a)}
              height={Math.max(0.5, barW - 1)}
              fill={sr.color}
            />
          ) : (
            <rect
              key={`b-${i}-${k}`}
              x={plot.x + band * i + offset}
              y={Math.min(a, z)}
              width={Math.max(0.5, barW - 1)}
              height={Math.abs(z - a)}
              fill={sr.color}
            />
          ),
        );
        if (c.showValues && (!stacked || k === series.length - 1)) {
          const text = fmt(stacked ? posBase + negBase : v);
          out.push(
            horizontal
              ? label(`bv-${i}-${k}`, text, Math.max(a, z) + 4, plot.y + band * i + offset + barW / 2, "start", axisFont * 0.9, c.axisColor)
              : label(
                  `bv-${i}-${k}`,
                  text,
                  plot.x + band * i + offset + (stacked ? inner : barW) / 2,
                  Math.min(a, z) - axisFont * 0.6,
                  "middle",
                  axisFont * 0.9,
                  c.axisColor,
                ),
          );
        }
      });
    }
  } else {
    const stackBase = new Array<number>(n).fill(0);
    series.forEach((sr, k) => {
      const points: [number, number][] = [];
      const basePoints: [number, number][] = [];
      for (let i = 0; i < n; i++) {
        const x = plot.x + band * (i + 0.5);
        const v = sr.values[i];
        const from = stacked ? stackBase[i] : 0;
        const to = from + v;
        if (stacked) {
          stackBase[i] = to;
        }
        points.push([x, scale(stacked ? to : v)]);
        basePoints.push([x, stacked ? scale(from) : zero]);
      }
      if (c.kind === "area") {
        const d = `M${points.map((p) => `${p[0]},${p[1]}`).join(" L")} L${[...basePoints]
          .reverse()
          .map((p) => `${p[0]},${p[1]}`)
          .join(" L")} Z`;
        out.push(<path key={`a-${k}`} d={d} fill={sr.color} fillOpacity={0.25} stroke="none" />);
      }
      out.push(
        <polyline
          key={`l-${k}`}
          points={points.map((p) => `${p[0]},${p[1]}`).join(" ")}
          fill="none"
          stroke={sr.color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />,
      );
      if (n <= 60) {
        points.forEach((p, i) => out.push(<circle key={`p-${k}-${i}`} cx={p[0]} cy={p[1]} r={3} fill={sr.color} />));
      }
      if (c.showValues) {
        points.forEach((p, i) =>
          out.push(label(`pv-${k}-${i}`, fmt(sr.values[i]), p[0], p[1] - axisFont * 0.8, "middle", axisFont * 0.9, c.axisColor)),
        );
      }
    });
  }
  return <>{out}</>;
}
