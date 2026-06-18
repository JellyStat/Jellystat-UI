import { useRouter } from "next/router";
import { Rocket, CheckCircle2, ArrowRight } from "lucide-react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";

export default function SetupCompletePage() {
  const router = useRouter();
  const { t } = useTranslation("common");

  return (
    <div className="w-full max-w-md mx-auto animate-in zoom-in-95 fade-in duration-700">
      
      {/* Celebratory Header */}
      <div className="flex flex-col items-center text-center mb-8 relative">
        
        {/* Animated Icon Ring */}
        <div className="relative w-20 h-20 mb-6">
          <div className="absolute inset-0 bg-brand-emerald/30 animate-ping rounded-full"></div>
          <div className="relative w-full h-full bg-gradient-to-br from-brand-cyan to-brand-emerald rounded-full flex items-center justify-center shadow-lg shadow-brand-emerald/30 border-2 border-white/20 z-10">
            <Rocket className="text-black ml-1 mb-1" size={36} />
          </div>
        </div>

        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-brand-emerald tracking-tight mb-3">
          {t("setup.complete_title", "Setup Complete")}
        </h2>
        <p className="text-sm text-gray-400 font-medium max-w-xs mx-auto leading-relaxed">
          {t("setup.complete_description", "Your Jellystat instance is fully configured and ready to track telemetry.")}
        </p>
      </div>

      {/* Action Card */}
      <div className="bg-surface/60 backdrop-blur-xl border border-border rounded-3xl shadow-2xl shadow-black/40 p-6 md:p-8 relative overflow-hidden text-center">
        
        {/* Ambient Glow */}
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-brand-emerald/10 blur-[80px] pointer-events-none rounded-full"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-cyan/10 blur-[80px] pointer-events-none rounded-full"></div>

        <div className="relative z-10 flex flex-col items-center space-y-8">
          
          {/* Status Badge */}
          <div className="flex items-center justify-center space-x-2 text-brand-emerald bg-brand-emerald/10 px-4 py-2 rounded-full border border-brand-emerald/20 shadow-inner">
            <CheckCircle2 size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">
              {t("setup.systems_operational", "All systems operational")}
            </span>
          </div>

          {/* Launch Button */}
          <button
            onClick={() => router.push("/login")}
            className="w-full relative group overflow-hidden rounded-xl p-[1px] transition-all active:scale-[0.98]"
          >
            {/* Animated Gradient Border Layer */}
            <span className="absolute inset-0 bg-gradient-to-r from-brand-cyan via-brand-emerald to-brand-cyan rounded-xl opacity-80 group-hover:opacity-100 transition-opacity bg-[length:200%_auto] animate-[gradient_2s_linear_infinite]"></span>
            
            {/* Inner Button Content */}
            <div className="relative flex items-center justify-center bg-surface hover:bg-transparent backdrop-blur-sm px-6 py-4 rounded-xl transition-colors">
              <span className="font-black text-white tracking-wide text-lg">
                {t("setup.launch_button", "Launch Jellystat")}
              </span>
              <ArrowRight size={20} className="text-white ml-2 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </button>
          
        </div>
      </div>
    </div>
  );
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale || "en", ["common"])),
    },
  };
}