import { useRouter } from "next/router";
import { SearchX, ArrowLeft } from "lucide-react";
import { useTranslation } from "next-i18next/pages";

export interface NotFoundProps {
  title?: string;
  message?: string;
  enableGoBack?: boolean;
}

export default function NotFound({
  title,
  message,
  enableGoBack = true,
}: NotFoundProps) {
  const router = useRouter();
  const { t } = useTranslation("common");

  const displayTitle = title || t("error_cards.not_found_title", "Not Found");
  const displayMessage = message || t("error_cards.not_found_message", "The requested resource could not be found.");

  return (
    <div className="flex items-center justify-center w-full h-full min-h-[300px] p-4 animate-in fade-in duration-500">
      
      <div className="bg-surface/60 backdrop-blur-xl border border-border rounded-3xl shadow-xl shadow-black/20 max-w-2xl w-full flex flex-col sm:flex-row items-center sm:items-stretch overflow-hidden group">
        
        {/* Left Icon Section */}
        <div className="bg-background/50 p-8 sm:p-10 flex items-center justify-center border-b sm:border-b-0 sm:border-r border-border shrink-0 relative overflow-hidden">
          {/* Subtle glow behind the icon */}
          <div className="absolute inset-0 bg-brand-cyan/5 group-hover:bg-brand-cyan/10 transition-colors duration-500"></div>
          
          <div className="relative w-20 h-20 bg-brand-cyan/10 rounded-full flex items-center justify-center border border-brand-cyan/20 shadow-inner">
            <SearchX size={40} className="text-brand-cyan opacity-80" />
          </div>
        </div>

        {/* Right Content Section */}
        <div className="p-8 sm:p-10 flex flex-col justify-center flex-1 text-center sm:text-left relative z-10">
          <h3 className="text-2xl font-black text-white tracking-tight mb-2">
            {displayTitle}
          </h3>
          
          <p className="text-gray-400 text-sm mb-8 leading-relaxed max-w-sm mx-auto sm:mx-0">
            {displayMessage}
          </p>

          {enableGoBack && (
            <button 
              onClick={() => router.back()} 
              className="sm:self-start flex items-center justify-center gap-2 bg-surface hover:bg-surface-hover border border-border hover:border-gray-500 text-gray-200 hover:text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-inner active:scale-95 focus:outline-none focus:ring-1 focus:ring-brand-cyan"
            >
              <ArrowLeft size={18} className="opacity-70" />
              {t("error_cards.go_back", "Go Back")}
            </button>
          )}
        </div>

      </div>

    </div>
  );
}