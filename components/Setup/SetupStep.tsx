import { ReactNode } from "react";

import { Card, cn } from "@/components/ui";

type Props = {
  icon: ReactNode;
  title: ReactNode;
  description: ReactNode;
  // Each step keeps its own colour pairing for the icon tile and the card's ambient glow.
  gradient: string;
  glow: string;
  children: ReactNode;
};

// Shared layout for the setup wizard form steps: icon tile, title, description and a glass card.
export default function SetupStep({ icon, title, description, gradient, glow, children }: Props) {
  return (
    <div className="w-full max-w-md mx-auto animate-in zoom-in-95 fade-in duration-500">
      <div className="flex flex-col items-center text-center mb-8">
        <div
          className={cn(
            "w-16 h-16 bg-gradient-to-br rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 mb-6 border border-white/10 text-white",
            gradient,
          )}
        >
          {icon}
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">{title}</h2>
        <p className="text-sm text-gray-400 font-medium">{description}</p>
      </div>

      <Card variant="glass" padding="none" className="p-6 md:p-8 relative">
        {/* Ambient glow */}
        <div className={cn("absolute w-48 h-48 blur-[80px] pointer-events-none rounded-full", glow)} />
        <div className="relative z-10">{children}</div>
      </Card>
    </div>
  );
}
