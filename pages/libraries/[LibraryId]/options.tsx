import type { LibrariesWithStats } from "@/lib/models/librariesWithStats";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { AlertTriangle, Loader, Loader2 } from "lucide-react";
import client from "@/lib/api";
import ConfirmationDialogButton from "@/components/Core/ConfirmationDialogButton";
import { toast } from "sonner";

type Props = {
  library: LibrariesWithStats | null;
};

export default function LibraryOptions({ library }: Props) {
  const { t } = useTranslation("common");
  const [loading, setLoading] = useState(false);

  if (!library || library.archived === false) return null;

  const deleteArchivedLibrary = async () => {
    setLoading(true);
    try {
      await client.Api.deleteArchived({ Id: library.id }).then(() => {
        //navigate to the libraries list page after deletion.
        window.location.href = "/libraries";
      });
    } catch (error: any) {
      const status = error?.status ?? "Unknown error";
      if (status == 404) {
        toast.error("Library is not archived");
      } else {
        toast.error(status);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full pt-2">
      <div className="overflow-hidden rounded-2xl border border-brand-rose/60 bg-surface/90 shadow-[0_0_0_1px_rgba(244,63,94,0.12)]">
        <div className="flex items-center gap-3 border-b border-brand-rose/35 bg-surface px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-rose/10 text-brand-rose ring-1 ring-brand-rose/35">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-gray-200">{t("library.DangerZone", "Danger Zone")}</h2>
          </div>
        </div>

        <div className="space-y-0 px-5 py-3">
          <div className="flex items-center justify-between gap-6 py-4">
            <div className="min-w-0 flex-1">
              <h5 className="text-2xl font-black tracking-tight text-gray-200">
                {t("library.deleteArchivedLibrary", "Delete Archived Library")}
              </h5>
              <p className="mt-1 max-w-2xl text-sm text-gray-400">
                {t(
                  "library.confirmDeleteArchivedLibraryDescription",
                  "Delete this archived library and its contents. This action cannot be rolled back.",
                )}
              </p>
            </div>

            <ConfirmationDialogButton
              disabled={loading}
              buttonElement={
                loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <div>{t("library.deleteLibrary", "Delete Library")}</div>
              }
              dialogTitle={t("library.deleteArchivedLibrary", "Delete Archived Library")}
              description={t("library.confirmDeleteArchivedLibrary", "Are you sure you want to delete this archived library?")}
              confirmText={t("common.yes", "Yes")}
              cancelText={t("common.no", "No")}
              onConfirm={deleteArchivedLibrary}
              className="inline-flex items-center justify-center rounded-xl border border-brand-rose/60 bg-brand-rose px-4 py-3 text-base font-semibold text-white transition hover:bg-rose-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
