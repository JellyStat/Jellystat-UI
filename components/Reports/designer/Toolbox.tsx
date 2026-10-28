import {
  BarChart3,
  Circle,
  Gauge,
  Heading,
  Image as ImageIcon,
  LineChart,
  Minus,
  PieChart,
  Square,
  Table2,
  Type,
  type LucideIcon,
} from "lucide-react";
import { TOOLBOX } from "@/lib/reports/defaults";
import { TOOLBOX_MIME } from "./DesignerCanvas";
import { useDesigner } from "./designerStore";

const ICONS: Record<string, LucideIcon> = {
  heading: Heading,
  text: Type,
  metric: Gauge,
  table: Table2,
  bar: BarChart3,
  line: LineChart,
  pie: PieChart,
  image: ImageIcon,
  rect: Square,
  ellipse: Circle,
  divider: Minus,
};

/** Drag a tool onto the page, or click it to drop it at the top-left margin. */
export default function Toolbox() {
  const { addElement, definition, page } = useDesigner();

  return (
    <div className="p-3">
      <p className="text-[11px] text-gray-500 mb-3">Drag onto the page, or click to add.</p>
      <div className="grid grid-cols-2 gap-2">
        {TOOLBOX.map((tool) => {
          const Icon = ICONS[tool.key] ?? Square;
          return (
            <button
              key={tool.key}
              type="button"
              draggable
              onDragStart={(ev) => {
                ev.dataTransfer.setData(TOOLBOX_MIME, tool.key);
                ev.dataTransfer.effectAllowed = "copy";
              }}
              onClick={() => {
                const offset = (page.elements.length % 10) * 12;
                addElement({
                  ...tool.create(),
                  x: definition.page.margin + offset,
                  y: definition.page.margin + offset,
                  name: tool.label,
                });
              }}
              className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border bg-background hover:border-brand-purple hover:bg-brand-purple/5 text-gray-300 hover:text-white transition-colors cursor-grab active:cursor-grabbing"
            >
              <Icon size={20} className="text-brand-purple" />
              <span className="text-[11px] font-semibold">{tool.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
