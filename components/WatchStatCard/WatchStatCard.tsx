import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { Image as ImageIcon } from "lucide-react";

import ItemTypes from "@/lib/models/enums/ItemTypes";
import { API_BASE } from "@/lib/api";

export type WatchStatItem = {
  id: string | number;
  name: string;
  type?: ItemTypes | string;
  value: number;
  imageTag?: string | null;
  icon?: React.ElementType | null; // Updated to support Lucide icons interchangeably
  serverId: string;
  navLink?: string;
};

export interface WatchStatCardProps {
  title?: string;
  unit?: string;
  items: WatchStatItem[];
  maxItems?: number;
}

export default function WatchStatCard({ 
  title, 
  unit, 
  items = [], 
  maxItems = 5 
}: WatchStatCardProps) {
  const router = useRouter();
  const { t } = useTranslation("common");
  const [imageError, setImageError] = useState(false);

  // Resolve defaults here so translations hook can catch them
  const resolvedTitle = title || t("stat_card.most_viewed", "Most Viewed");
  const resolvedUnit = unit || t("stat_card.plays", "Plays");

  const display = items.slice(0, maxItems);

  if (items.length === 0) {
    return null;
  }

  const topItem = display[0];
  const imageUrl = `${API_BASE}Proxy/Images/Items/Primary?Id=${encodeURIComponent(topItem.id)}&Width=600&ServerId=${encodeURIComponent(topItem.serverId)}`;
  const backgroundImage = `${API_BASE}Proxy/Images/Items/Backdrop?Id=${encodeURIComponent(topItem.id)}&Width=300&Quality=80&ServerId=${encodeURIComponent(topItem.serverId)}`;
  
  const Icon = topItem.icon ?? ImageIcon;

  return (
    <div className="relative w-full max-w-[700px] h-[180px] rounded-2xl border border-border shadow-lg shadow-black/20 overflow-hidden group">
      
      {/* Blurred Background Banner */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-40 transition-transform duration-700 ease-out group-hover:scale-105"
        style={{ backgroundImage: `url('${backgroundImage}')` }}
      />
      
      {/* Glass Overlay for Text Readability */}
      <div className="absolute inset-0 bg-surface/60 backdrop-blur-md"></div>

      {/* Main Card Content */}
      <div className="relative z-10 flex h-full">
        
        {/* Leading Poster Image */}
        <div className="h-full w-[120px] shrink-0 bg-black/40 border-r border-white/5 relative z-20 shadow-[4px_0_15px_rgba(0,0,0,0.3)]">
          {topItem.imageTag && !imageError ? (
            <img
              src={imageUrl}
              alt={topItem.name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <Icon size={48} className="drop-shadow-md opacity-50" />
            </div>
          )}
        </div>

        {/* Stats List Body */}
        <div className="flex flex-col flex-1 min-w-0 p-4">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/50 shrink-0">
            <h3 className="text-sm font-black text-white tracking-tight truncate pr-3">
              {resolvedTitle}
            </h3>
            <span className="text-xs font-bold text-brand-cyan tracking-wider uppercase shrink-0">
              {resolvedUnit}
            </span>
          </div>

          {/* List Items */}
          <div className="flex flex-col gap-2 flex-1 min-w-0 overflow-hidden">
            {display.map((it, idx) => (
              <div key={it.id} className="flex items-center justify-between gap-3 text-sm">
                
                {/* Left Side: Rank & Title */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-gray-500 w-3 shrink-0">
                    {idx + 1}
                  </span>
                  
                  {it.navLink ? (
                    <Link 
                      href={it.navLink}
                      className="text-gray-200 hover:text-white font-medium truncate transition-colors focus:outline-none focus:text-brand-cyan"
                      title={it.name}
                    >
                      {it.name}
                    </Link>
                  ) : (
                    <span 
                      className="text-gray-200 font-medium truncate"
                      title={it.name}
                    >
                      {it.name}
                    </span>
                  )}
                </div>

                {/* Right Side: Value */}
                <span className="font-bold text-gray-300 shrink-0 tabular-nums">
                  {it.value}
                </span>
                
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}