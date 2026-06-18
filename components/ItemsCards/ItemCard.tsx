import React from "react";
import { API_BASE } from "@/lib/api";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { ItemsWithStats } from "@/lib/models/itemsWithStats";

type Props = {
  item: ItemsWithStats;
};

export const ItemCard: React.FC<Props> = ({ item }) => {
  const router = useRouter();
  const { t, i18n } = useTranslation("common");

  const isValidParent = item.parent && item.parent.id && item.parent.id !== item.id;
  const id = isValidParent ? item.parent!.id : item.id;
  const serverId = item.serverId;
  const imageUrl = `${API_BASE}Proxy/Images/Items/Primary?Id=${encodeURIComponent(id)}&Width=400&ServerId=${encodeURIComponent(serverId)}`;

  // Formatting
  const indexString = item.parentIndex != null ? `S${item.parentIndex.toString().padStart(2, '0')} • E${item.index?.toString().padStart(2, '0')}` : "";
  const title = isValidParent ? item.parent!.name : item.name;
  const formattedDate = item.dateCreated 
    ? new Date(item.dateCreated).toLocaleDateString(i18n.language || undefined, { month: 'short', day: 'numeric', year: 'numeric' }) 
    : "";

  return (
    <div 
      onClick={() => router.push(`/libraries/items/${encodeURIComponent(item.id)}`)}
      className="group flex flex-col h-full w-full cursor-pointer"
    >
      {/* Poster Image Container */}
      <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-surface border border-border shadow-md transition-all duration-300 group-hover:shadow-brand-cyan/20 group-hover:border-gray-500 group-hover:shadow-xl mb-3 shrink-0">
        
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-110"
          style={{ backgroundImage: `url('${imageUrl}')` }}
        />
        
        {/* Inner shadow overlay for depth */}
        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-xl pointer-events-none"></div>
        
        {/* Archived Badge (if applicable) */}
        {item.archived && (
          <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md text-[10px] font-bold text-gray-300 px-2 py-1 rounded-md border border-white/10 uppercase tracking-widest shadow-lg">
            {t("item.archived", "Archived")}
          </div>
        )}
      </div>

      {/* Metadata Container */}
      <div className="flex flex-col flex-1 px-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-cyan mb-1 truncate">
          {formattedDate}
        </span>
        
        <h3 className="text-sm font-bold text-gray-100 leading-tight mb-1 line-clamp-2 group-hover:text-white transition-colors">
          {title}
        </h3>
        
        {isValidParent && (
          <div className="mt-auto">
            <p className="text-xs text-gray-400 truncate mt-0.5">{item.name}</p>
            <p className="text-[10px] font-mono text-gray-500 mt-0.5">{indexString}</p>
          </div>
        )}
      </div>
      
    </div>
  );
};

export default ItemCard;