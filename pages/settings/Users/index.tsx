import { useTranslation } from "react-i18next";
import { useCallback, useState, useEffect } from "react";
import { Users } from "@/lib/models/users";
import { GridifyQueryBuilder } from "gridify-client";
import { Dialog } from "@headlessui/react";
import client from "@/lib/api";
import { AlertCircle, Loader2, Plus, UserIcon, Users as UsersIcon } from "lucide-react";
import configManager from "@/lib/configManager";
import { Server } from "@/lib/models/server";

import AddUserModal from "./AddUser";
import UpdateUserModal from "./UpdateUser";
import ConfirmationDialogButton from "@/components/Core/ConfirmationDialogButton";

export default function UsersSettingsPage() {
  const { t } = useTranslation("common");

  // --- STATE ---
  const [usersData, setUsersData] = useState<Users[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverData, setServerData] = useState<Server[]>([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isUpdateUserOpen, setIsUpdateUserOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // --- DATA FETCHING ---
  const fetchPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      configManager
        .getConfig()
        .then((list: Server[]) => {
          setServerData(list);
        })
        .catch((err) => console.error("Failed to load server options", err));
      const query = new GridifyQueryBuilder();
      const builtQuery = query.build();

      const res = await client.Api.getLocalUsers(builtQuery);
      setUsersData(res?.data ?? []);
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      console.error(err);
      setError(err?.message ?? t("settings.error_load_users", "Failed to load users"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  function findDefaultServer(user: Users): string | null {
    if (!user.serverId && user.serverId == "") return null;
    const server = serverData.find((s) => s.id === user.serverId);
    return server ? server.name : null;
  }

  function handleUpdateUser(userId: string) {
    setSelectedUserId(userId);
    setIsUpdateUserOpen(true);
  }

  async function handleDeleteUser(userId: string) {
    try {
      setLoading(true);
      await client.Auth.deleteUser({ Id: userId });
      fetchPage();
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? t("settings.error_delete_user", "Failed to delete user"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12 p-6">
      {/* Header Container */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/50 pb-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-brand-purple/10 rounded-2xl border border-brand-purple/20 shadow-inner shrink-0">
            <UsersIcon size={28} className="text-brand-purple" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">{t("settings.users_title", "User Settings")}</h1>
            <p className="text-sm text-gray-400 mt-1 font-medium">
              {t("settings.users_subtitle", "Manage local Jellystat users.")}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative min-h-[400px]">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <UsersIcon size={20} className="text-brand-purple" />
              {t("settings.local_users", "Local Users")}
            </h2>
            <button
              onClick={() => setIsAddUserOpen(true)}
              className="flex items-center gap-2 bg-surface hover:bg-surface-hover border border-border hover:border-brand-purple transition-colors px-4 py-2 rounded-xl text-sm font-bold shadow-inner"
            >
              <Plus size={16} className="text-brand-purple" />
              {t("settings.add_user", "Add User")}
            </button>
          </div>

          <div className="bg-surface border border-border rounded-2xl shadow-xl shadow-black/20 overflow-hidden relative ">
            {loading && (
              <div className="absolute inset-0 z-20 bg-surface/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in">
                <Loader2 size={32} className="text-brand-purple animate-spin mb-3" />
              </div>
            )}

            {error && !loading && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle size={32} className="text-brand-rose mb-2" />
                <span className="text-sm text-gray-400">{error}</span>
              </div>
            )}

            {!loading && !error && usersData.length === 0 ? (
              <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center">
                <UsersIcon size={48} className="mb-4 opacity-20" />
                <span className="font-bold text-lg">{t("settings.no_users", "No users found")}</span>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {usersData.map((user) => (
                  <div
                    key={user.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-hover transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 mx-auto rounded-full bg-surface border border-border shadow-inner overflow-hidden flex items-center justify-center shrink-0">
                        <UserIcon size={20} className="text-gray-500" />
                      </div>
                      <h3 className="font-bold text-gray-100 flex items-center gap-2">{user.username}</h3>
                      {findDefaultServer(user) && (
                        <span className="text-[10px] uppercase tracking-wider bg-brand-purple/10 text-brand-purple border border-brand-purple/20 px-2 py-0.5 rounded-full">
                          {findDefaultServer(user)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateUser(user.id)}
                        className="px-3 py-1.5 text-xs font-bold text-gray-300 hover:text-white bg-background border border-border hover:border-gray-500 rounded-lg transition-all shadow-inner"
                      >
                        Edit
                      </button>

                      <ConfirmationDialogButton
                        disabled={loading}
                        buttonElement={
                          loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <div>{t("user.deleteUser", "Delete")}</div>
                        }
                        dialogTitle={t("user.deleteUser", "Delete User {{username}}", { username: user.username })}
                        description={t("user.confirmDeleteUser", "Are you sure you want to delete user {{username}}?", {
                          username: user.username,
                        })}
                        onConfirm={() => handleDeleteUser(user.id)}
                        actionColor="bg-brand-rose"
                        className="px-3 py-1.5 text-xs font-bold text-brand-rose hover:text-white border-brand-rose/60 bg-brand-rose/10 border hover:bg-rose-600 rounded-lg transition-all shadow-inner"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isAddUserOpen} onClose={setIsAddUserOpen} className="relative z-50 focus:outline-none">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <AddUserModal onClose={() => setIsAddUserOpen(false)} onCreated={fetchPage} />
        </div>
      </Dialog>

      <Dialog open={isUpdateUserOpen} onClose={setIsUpdateUserOpen} className="relative z-50 focus:outline-none">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <UpdateUserModal userId={selectedUserId!} onClose={() => setIsUpdateUserOpen(false)} onCreated={fetchPage} />
        </div>
      </Dialog>
    </div>
  );
}
