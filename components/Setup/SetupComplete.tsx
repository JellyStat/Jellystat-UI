import { useRouter } from "next/router";
import { Rocket, CheckCircle2, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge, Button } from "@/components/ui";
import SetupStep from "./SetupStep";

export default function SetupCompletePage() {
  const router = useRouter();
  const { t } = useTranslation("common");

  return (
    <SetupStep
      variant="success"
      icon={<Rocket size={32} />}
      title={t("setup.complete_title", "Setup Complete")}
      description={t("setup.complete_description", "Your Jellystat instance is fully configured and ready to track telemetry.")}
    >
      <div className="flex flex-col items-center gap-6">
        <Badge tone="success" className="gap-2 px-4 py-2">
          <CheckCircle2 size={14} />
          {t("setup.systems_operational", "All systems operational")}
        </Badge>

        <Button size="lg" className="w-full group" onClick={() => router.push("/login")}>
          {t("setup.launch_button", "Launch Jellystat")}
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </SetupStep>
  );
}
