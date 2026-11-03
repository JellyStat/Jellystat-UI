import type { LibrariesWithStats } from "@/lib/models/librariesWithStats";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { AlertTriangle, Loader } from "lucide-react";
import client from "@/lib/api";
import ConfirmationDialogButton from "@/components/ConfirmationDialogButton";
import { toast } from "sonner";
import { Spinner } from "@/components/ui";

type Props = {
  library: LibrariesWithStats;
};

export default function LibraryOptions({ library }: Props) {
  const { t } = useTranslation("common");
  const [loading, setLoading] = useState(false);

  const deleteArchivedLibrary = async () => {
    setLoading(true);
    try {
      await client.Api.deleteArchived({ Id: library.id }).then(() => {
        //navigate to the libraries list page after deletion.
        window.location.href = "/libraries";
      });
    } catch (error: any) {
      if (error?.status == 404) {
        toast.error(t("library.not_archived", "Library is not archived"));
      } else {
        toast.error(
          t("library.delete_archived_failed", "Delete failed: {{error}}", {
            error: error?.message || error?.statusText || String(error),
          }),
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full pt-2">
      <div className="overflow-hidden rounded-2xl border border-danger/60 bg-surface/90 shadow-[0_0_0_1px_rgba(244,63,94,0.12)]">
        <div className="flex items-center gap-3 border-b border-danger/35 bg-surface px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-danger/10 text-danger ring-1 ring-danger/35">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-200">{t("library.DangerZone", "Danger Zone")}</h2>
          </div>
        </div>

        {library.archived == true && (
          <div className="space-y-0 px-5 py-3">
            <div className="flex items-center justify-between gap-6 py-4">
              <div className="min-w-0 flex-1">
                <h5 className="text-2xl font-bold tracking-tight text-gray-200">
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
                  loading ? (
                    <Spinner className="h-5 w-5" />
                  ) : (
                    <div>{t("library.deleteLibrary", "Delete Library")}</div>
                  )
                }
                dialogTitle={t("library.deleteArchivedLibrary", "Delete Archived Library")}
                description={t("library.confirmDeleteArchivedLibrary", "Are you sure you want to delete this archived library?")}
                confirmText={t("common.delete", "Delete")}
                cancelText={t("common.cancel", "Cancel")}
                onConfirm={deleteArchivedLibrary}
                tone="danger"
                className="inline-flex items-center justify-center rounded-xl border border-danger/60 bg-danger-solid px-4 py-3 text-base font-semibold text-white transition hover:bg-danger-solid-hover"
              />
            </div>
          </div>
        )}

        {library.archived == true && library.hasArchivedItems == true && <div className="border-t border-danger/35" />}

        {library.hasArchivedItems == true && (
          <div className="space-y-0 px-5 py-3">
            <div className="flex items-center justify-between gap-6 py-4">
              <div className="min-w-0 flex-1">
                <h5 className="text-2xl font-bold tracking-tight text-gray-200">
                  {t("library.deleteArchivedItems", "Delete Archived Items")}
                </h5>
                <p className="mt-1 max-w-2xl text-sm text-gray-400">
                  {t(
                    "library.confirmDeleteArchivedItemsDescription",
                    "Delete all archived items in this library. This action cannot be rolled back.",
                  )}
                </p>
              </div>

              <ConfirmationDialogButton
                disabled={loading}
                buttonElement={
                  loading ? (
                    <Spinner className="h-5 w-5" />
                  ) : (
                    <div>{t("library.deleteLibraryItems", "Delete Items")}</div>
                  )
                }
                dialogTitle={t("library.deleteArchivedItems", "Delete Archived Items")}
                description={t(
                  "library.confirmDeleteArchivedItems",
                  "Are you sure you want to delete all archived items in this library?",
                )}
                confirmText={t("common.delete", "Delete")}
                cancelText={t("common.cancel", "Cancel")}
                onConfirm={deleteArchivedLibrary}
                tone="danger"
                className="inline-flex items-center justify-center rounded-xl border border-danger/60 bg-danger-solid px-4 py-3 text-base font-semibold text-white transition hover:bg-danger-solid-hover"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
