import { useTranslation } from "react-i18next";
import { AlertCircle, Loader2, Trophy } from "lucide-react";
import { WatchStatItem } from "../WatchStatCards/WatchStatCards";
import { API_BASE } from "@/lib/api";

export function LeaderboardCard({
  title,
  unit,
  items,
  icon: Icon,
  loading,
}: {
  title: string;
  unit: string;
  items: WatchStatItem[];
  icon: any;
  loading: boolean;
}) {
  const { t } = useTranslation("common");

  function getAvatarCss(index: number) {
    if (index === 0) {
      return "bg-brand-purple/20 text-brand-purple border-brand-purple/30";
    }
    if (index === 1) {
      return "bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20";
    }
    if (index === 2) {
      return "bg-brand-emerald/10 text-brand-emerald border-brand-emerald/20";
    }
    return "bg-surface text-gray-400 border-border";
  }

  const topItem = items.length > 0 ? items[0] : null;
  const bgUrl = topItem
    ? `${API_BASE}/Proxy/Images/Items/Backdrop?Id=${encodeURIComponent(topItem.id)}&Blur=1&Width=300&Quality=80&ServerId=${encodeURIComponent(topItem.serverId ?? "")}`
    : "";

  return (
    <div
      className="bg-surface/80 border  border-border rounded-2xl flex flex-col relative overflow-hidden group hover:border-brand-purple/30 transition-colors"
      style={{ backgroundImage: `url('${bgUrl}')`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="p-5 transition-colors bg-linear-to-t from-transparent via-surface/90 to-surface">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 border-b border-border/50 pb-3">
          <div className="p-2 bg-brand-purple/10 rounded-lg text-brand-purple">
            <Icon size={18} />
          </div>
          <h3 className="font-bold text-gray-100 text-sm uppercase tracking-wider truncate">{title}</h3>
        </div>

        {/* List Area */}
        <div className="flex-1 relative min-h-[200px]">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Loader2 size={24} className="text-brand-purple animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
              <AlertCircle size={24} className="mb-2 opacity-30" />
              <span className="text-xs font-medium">{t("watch_stat_cards.no_records", "No records found")}</span>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-background/80 border border-transparent hover:border-brand-purple/20 hover:bg-surface transition-all"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                      className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-black text-[10px] shadow-inner border ${getAvatarCss(
                        index,
                      )}`}
                    >
                      {index === 0 ? <Trophy size={12} /> : `#${index + 1}`}
                    </div>

                    {item.navLink ? (
                      <a href={item.navLink} className="text text-gray-200 hover:text-brand-cyan transition-colors truncate">
                        {item.name}
                      </a>
                    ) : (
                      <span className="text text-gray-200 truncate">{item.name}</span>
                    )}
                  </div>

                  <div className="flex flex-col items-end shrink-0 ml-2">
                    <span className="text font-black text-gray-200 leading-none">{item.value}</span>
                    <span className="text-[11px] uppercase tracking-wider text-gray-400 mt-1">{unit}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
