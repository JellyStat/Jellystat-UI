import { useRouter } from 'next/router';
import { Film, Tv, Music, Image as ImageIcon, Folders, ChevronRight } from 'lucide-react';

interface LibraryOverviewCardProps {
  library: any;
}

export default function LibraryOverviewCard({ library }: LibraryOverviewCardProps) {
  const router = useRouter();

  let Icon = Folders;
  let themeColor = "brand-cyan";
  
  const type = library.CollectionType?.toLowerCase() || '';
  
  if (type === 'movies') {
    Icon = Film;
    themeColor = "brand-purple";
  } else if (type === 'tvshows') {
    Icon = Tv;
    themeColor = "brand-emerald";
  } else if (type === 'music') {
    Icon = Music;
    themeColor = "brand-amber";
  } else if (type === 'homevideos' || type === 'photos') {
    Icon = ImageIcon;
    themeColor = "brand-rose";
  }

  const iconBg = `bg-${themeColor}/10`;
  const iconText = `text-${themeColor}`;
  const hoverBorder = `hover:border-${themeColor}/50`;
  const hoverShadow = `group-hover:shadow-${themeColor}/10`;

  return (
    <div 
      onClick={() => router.push(`/libraries/${library.Id}`)}
      className={`relative flex items-center p-4 bg-surface/50 backdrop-blur-sm border border-border rounded-2xl cursor-pointer transition-all duration-300 group hover:-translate-y-0.5 shadow-md hover:shadow-xl ${hoverBorder} ${hoverShadow}`}
    >
      {/* Icon Container */}
      <div className={`p-3 rounded-xl border border-border/50 shadow-inner mr-4 transition-transform duration-300 group-hover:scale-110 ${iconBg} ${iconText}`}>
        <Icon size={22} />
      </div>

      {/* Library Info */}
      <div className="flex flex-col flex-1 min-w-0">
        <h3 className="text-sm font-bold text-gray-100 truncate group-hover:text-white transition-colors">
          {library.Name}
        </h3>
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-0.5">
          {library.CollectionType || 'Mixed Content'}
        </span>
      </div>

      {/* Action Chevron */}
      <div className="pl-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
        <ChevronRight size={18} className={iconText} />
      </div>

      {/* Ambient Inner Glow */}
      <div className={`absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5 pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100`}></div>
    </div>
  );
}