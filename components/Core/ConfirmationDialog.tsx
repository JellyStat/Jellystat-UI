import { Button, Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { AlertCircle, LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
  open: boolean;
  onSubmit: (confirmed: boolean) => void;
  Title: string;
  Description: string;
  YesText?: string;
  NoText?: string;
  DialogIcon?: LucideIcon;
  IconColor?: "text-brand-rose" | "text-brand-cyan" | "text-brand-purple" | "text-brand-emerald";
  ActionColor?: "bg-brand-rose" | "bg-brand-cyan" | "bg-brand-purple" | "bg-brand-emerald";
}

export default function ConfirmationDialog({
  open,
  onSubmit,
  Title,
  Description,
  YesText,
  NoText,
  DialogIcon = AlertCircle,
  IconColor = "text-brand-rose",
  ActionColor = "bg-brand-cyan",
}: Props) {
  const { t } = useTranslation("common");
  YesText ??= t("common.yes", "Yes");
  NoText ??= t("common.no", "No");

  return (
    <Dialog
      open={open}
      onClose={() => {
        onSubmit(false);
      }}
      className="relative z-50 focus:outline-none"
    >
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          transition
          className="w-full m-50 rounded-2xl border border-border bg-surface p-5 shadow-2xl shadow-black/40 duration-100 ease-out data-closed:transform-[scale(95%)] data-closed:opacity-0"
        >
          <DialogTitle className="text-lg font-black text-white">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3 shrink-0">
                <DialogIcon className={`${IconColor} overflow-hidden text-ellipsis`} size={28} />
                {Title}
              </h2>
            </div>
          </DialogTitle>

          <p className="text-md text-gray-400">{Description}</p>
          <div className="mt-6 flex justify-end gap-4">
            <Button
              onClick={() => onSubmit(true)}
              className={`px-4 py-2 rounded-lg ${ActionColor} text-white hover:${ActionColor}/90 transition-all cursor-pointer`}
            >
              {YesText}
            </Button>
            <Button
              onClick={() => onSubmit(false)}
              className="px-4 py-2 rounded-lg bg-background border border-border text-gray-200 hover:text-white hover:border-gray-500 transition-all cursor-pointer"
            >
              {NoText}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
