import { useTranslation } from "react-i18next";
import { useCallback, useState, useEffect } from "react";
import { Users } from "@/lib/models/users";
import { GridifyQueryBuilder } from "gridify-client";
import client from "@/lib/api";
import { AlertCircle, Plus, UserIcon, Users as UsersIcon } from "lucide-react";
import configManager from "@/lib/configManager";
import { Server } from "@/lib/models/server";

import AddUserModal from "./AddUser";
import UpdateUserModal from "./UpdateUser";
import ConfirmationDialogButton from "@/components/ConfirmationDialogButton";
import {
  Badge,
  Button,
  buttonClass,
  Card,
  EmptyState,
  Modal,
  Page,
  PageHeader,
  SectionTitle,
  Spinner,
} from "@/components/ui";

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
    <Page className="pt-4 sm:px-6 sm:pt-6">
      <PageHeader
        icon={<UsersIcon size={28} />}
        title={t("settings.users_title", "User Settings")}
        description={t("settings.users_subtitle", "Manage local Jellystat users.")}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <SectionTitle className="flex items-center gap-2">
            <UsersIcon size={20} className="text-primary" />
            {t("settings.local_users", "Local Users")}
          </SectionTitle>
          <Button variant="outline" onClick={() => setIsAddUserOpen(true)}>
            <Plus size={16} className="text-primary" />
            {t("settings.add_user", "Add User")}
          </Button>
        </div>

        <Card padding="none" className="relative min-h-[200px]">
          {loading && (
            <div className="absolute inset-0 z-20 bg-surface/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in">
              <Spinner size={32} tone="primary" />
            </div>
          )}

          {error && !loading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 p-6 text-center">
              <AlertCircle size={32} className="text-danger" />
              <span className="text-sm text-gray-400">{error}</span>
            </div>
          )}

          {!loading && !error && usersData.length === 0 ? (
            <EmptyState bordered={false} Icon={UsersIcon} title={t("settings.no_users", "No users found")} />
          ) : (
            <div className="divide-y divide-border/50">
              {usersData.map((user) => {
                const defaultServer = findDefaultServer(user);
                return (
                  <div
                    key={user.id}
                    className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-surface-hover transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-surface-raised border border-border flex items-center justify-center shrink-0">
                        <UserIcon size={20} className="text-gray-500" />
                      </div>
                      <h3 className="font-bold text-white truncate min-w-0">{user.username}</h3>
                      {defaultServer && <Badge tone="primary">{defaultServer}</Badge>}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="secondary" size="sm" onClick={() => handleUpdateUser(user.id)}>
                        {t("common.edit", "Edit")}
                      </Button>

                      <ConfirmationDialogButton
                        disabled={loading}
                        buttonElement={loading ? <Spinner size={14} /> : t("common.delete", "Delete")}
                        dialogTitle={t("user.deleteUser", "Delete User {{username}}", { username: user.username })}
                        description={t("user.confirmDeleteUser", "Are you sure you want to delete user {{username}}?", {
                          username: user.username,
                        })}
                        onConfirm={() => handleDeleteUser(user.id)}
                        tone="danger"
                        className={buttonClass({ variant: "dangerSoft", size: "sm" })}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Modal open={isAddUserOpen} onClose={setIsAddUserOpen}>
        <AddUserModal onClose={() => setIsAddUserOpen(false)} onCreated={fetchPage} />
      </Modal>

      <Modal open={isUpdateUserOpen} onClose={setIsUpdateUserOpen}>
        <UpdateUserModal userId={selectedUserId!} onClose={() => setIsUpdateUserOpen(false)} onCreated={fetchPage} />
      </Modal>
    </Page>
  );
}
