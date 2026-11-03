import React, { useEffect, useState } from "react";
import { Eye, EyeOff, Lock, Server as ServerIcon, User, UserPen } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";

import client from "@/lib/api";
import { LocalUser } from "@/lib/models/localUser";
import type { Server } from "@/lib/models/server";
import configManager from "@/lib/configManager";
import {
  Button,
  ErrorAlert,
  Field,
  Input,
  InputAction,
  ModalFooter,
  ModalHeader,
  ModalPanel,
  Select,
  Spinner,
} from "@/components/ui";

type Props = {
  userId: string;
  onClose: () => void;
  onCreated?: () => void;
};

export default function UpdateUserModal({ userId, onClose, onCreated }: Props) {
  const { t } = useTranslation("common");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string; confirmPassword?: string }>({});
  const [user, setUser] = useState<LocalUser | null>(null);
  const [servers, setServers] = useState<Server[]>([]);
  const [serverId, setServerId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        setLoading(true);
        const query = new GridifyQueryBuilder();
        query.addCondition("Id", op.Equal, userId);
        const builtQuery = query.build();
        const [response, serverList] = await Promise.all([
          client.Api.getLocalUsers(builtQuery),
          configManager.getConfig().catch((err) => {
            console.error("Failed to load servers:", err);
            return [] as Server[];
          }),
        ]);
        const data = response?.data ?? [];
        const user = data.FirstOrDefault();
        setUser(user ?? null);
        setServers(serverList ?? []);
        setServerId(user?.serverId || null);
      } catch (err) {
        console.error("Failed to fetch user:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [userId]);

  const serverChanged = !!serverId && serverId !== (user?.serverId || null);
  const passwordEntered = password.trim() !== "" || confirmPassword.trim() !== "";

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();

    setError(null);
    setFieldErrors({});

    // Password is optional here: only validate it when the admin is changing it
    const nextFieldErrors: typeof fieldErrors = {};
    if (passwordEntered) {
      if (!password.trim()) {
        nextFieldErrors.password = t("errors.password_is_required", "Password is required");
      }

      if (!confirmPassword.trim()) {
        nextFieldErrors.confirmPassword = t("errors.confirm_password_is_required", "Confirm password is required");
      }

      if (password !== confirmPassword) {
        nextFieldErrors.confirmPassword = t("errors.passwords_do_not_match", "Passwords do not match");
        nextFieldErrors.password = t("errors.passwords_do_not_match", "Passwords do not match");
      }
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setLoading(true);
    try {
      if (serverChanged) {
        await client.Api.setLocalUserServer({ userId: user!.id!, serverId: serverId! });
      }
      if (passwordEntered) {
        await client.Auth.updateUser({ ...user!, password });
      }
      toast.success(t("settings.toast_user_updated", "User updated successfully"));
      onCreated?.();
      onClose();
    } catch (err: any) {
      const message = err?.message ?? t("errors.failed_to_update_user", "Failed to update user");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  const togglePassword = (
    <InputAction onClick={() => setShowPassword((current) => !current)}>
      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
    </InputAction>
  );

  return (
    <ModalPanel>
      <ModalHeader
        icon={<UserPen size={22} />}
        title={t("settings.update_user", "Update User")}
        description={t("settings.update_user_desc", "Update the local Jellystat user account.")}
      />

      {loading && !user && (
        <div className="w-full h-[450px] flex flex-col items-center justify-center gap-3">
          <Spinner size={40} tone="primary" />
          <span className="text-sm text-gray-400 font-medium">{t("common.loading", "Loading")}</span>
        </div>
      )}

      {user && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label={t("common.username", "Username")} htmlFor="update-user-username">
            <Input
              id="update-user-username"
              type="text"
              value={user.username ?? ""}
              disabled
              leftIcon={<User size={18} />}
            />
          </Field>

          <Field
            label={t("settings.default_server", "Default Server")}
            description={t("settings.default_server_desc", "The server this user sees when they sign in.")}
          >
            <Select<string>
              data={servers.map((s) => ({ value: s.id, Icon: ServerIcon }))}
              value={serverId ?? undefined}
              onChange={(value) => setServerId(value)}
              labelFn={(value) => {
                const server = servers.find((s) => s.id === value);
                return server ? `${server.type ? `${server.type} - ` : ""}${server.name}` : value;
              }}
              placeholder={t("settings.no_default_server", "No default server")}
              emptyDataMessage={t("empty.no_servers_connected", "No servers connected")}
              leftIcon={ServerIcon}
              disabled={loading || servers.length === 0}
              widthPx={0}
              className="w-full"
            />
          </Field>

          <Field label={t("common.password", "Password")} htmlFor="update-user-password" error={fieldErrors.password}>
            <Input
              id="update-user-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder={t("settings.placeholder_new_password", "Leave blank to keep the current password")}
              leftIcon={<Lock size={18} />}
              error={!!fieldErrors.password}
              rightSlot={togglePassword}
            />
          </Field>

          <Field
            label={t("common.confirm_password", "Confirm Password")}
            htmlFor="update-user-password-confirm"
            error={fieldErrors.confirmPassword}
          >
            <Input
              id="update-user-password-confirm"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              placeholder={t("settings.placeholder_password", "Enter your password")}
              leftIcon={<Lock size={18} />}
              error={!!fieldErrors.confirmPassword}
            />
          </Field>

          {error && <ErrorAlert>{error}</ErrorAlert>}

          <ModalFooter>
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button type="submit" loading={loading} disabled={!passwordEntered && !serverChanged}>
              {loading ? t("settings.updating_user", "Updating") : t("common.update", "Update")}
            </Button>
          </ModalFooter>
        </form>
      )}
    </ModalPanel>
  );
}
