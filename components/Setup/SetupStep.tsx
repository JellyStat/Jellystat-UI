import { ReactNode } from "react";

import { Card, cn } from "@/components/ui";

type Props = {
  icon: ReactNode;
  title: ReactNode;
  description: ReactNode;
  // "success" adds a pulsing ring for the final step.
  variant?: "default" | "success";
  children: ReactNode;
};

// Shared layout for the setup wizard steps: icon tile, title, description and a glass card.
export default function SetupStep({ icon, title, description, variant = "default", children }: Props) {
  const success = variant === "success";

  return (
    <div className="w-full max-w-md mx-auto animate-in zoom-in-95 fade-in duration-500">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="relative mb-6">
          {success && <div className="absolute inset-0 bg-success/30 animate-ping rounded-2xl" />}
          <div
            className={cn(
              "relative w-16 h-16 rounded-2xl flex items-center justify-center border border-white/10 text-white shadow-lg",
              success
                ? "bg-gradient-to-br from-accent to-success shadow-success/20"
                : "bg-gradient-to-br from-accent to-primary shadow-primary/20",
            )}
          >
            {icon}
          </div>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">{title}</h2>
        <p className="text-sm text-gray-400 font-medium max-w-xs">{description}</p>
      </div>

      <Card variant="glass" className="relative">
        {/* Ambient glow */}
        <div
          className={cn(
            "absolute -top-24 -right-24 w-48 h-48 blur-[80px] pointer-events-none rounded-full",
            success ? "bg-success/10" : "bg-primary/10",
          )}
        />
        <div className="relative z-10">{children}</div>
      </Card>
    </div>
  );
}
