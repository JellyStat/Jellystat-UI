import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  ip: string;
};

export function IpLookupModal({ ip }: Props) {
  const { t } = useTranslation("common");
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);

  return (
    <div>
      <a onClick={() => setShow(true)} className="cursor-pointer hover:text-brand-cyan">
        {ip}
      </a>
      <Dialog open={show} onClose={() => setShow(false)} className="relative z-50 focus:outline-none">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel
            transition
            className=" h-3/4 w-1/2 rounded-2xl border border-border bg-surface p-5 shadow-2xl shadow-black/40 duration-100 ease-out data-closed:transform-[scale(95%)] data-closed:opacity-0"
          >
            <DialogTitle className="text-lg font-black text-white">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3 shrink-0">
                  Geolocation Info for IP: {ip}
                </h2>
              </div>
            </DialogTitle>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShow(false)}
                className="px-4 py-2 rounded-lg bg-background border border-border text-gray-200 hover:text-white hover:border-gray-500 transition-all"
              >
                {t("common.close", "Close")}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
