import React, { useState } from "react";
import { Eye, EyeOff, Lock, User, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import client from "@/lib/api";
import { Button, ErrorAlert, Field, Input, InputAction, ModalFooter, ModalHeader, ModalPanel } from "@/components/ui";

type Props = {
  onClose: () => void;
  onCreated?: () => void;
};

export default function AddUserModal({ onClose, onCreated }: Props) {
  const { t } = useTranslation("common");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError(null);
    setFieldErrors({});

    const nextFieldErrors: typeof fieldErrors = {};
    if (!username.trim()) {
      nextFieldErrors.username = t("errors.username_is_required", "Username is required");
    }
    if (!password.trim()) {
      nextFieldErrors.password = t("errors.password_is_required", "Password is required");
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setLoading(true);
    try {
      await client.Auth.createUser({ username: username.trim(), password: password.trim() });
      toast.success(t("settings.toast_user_created", "User created successfully"));
      onCreated?.();
      onClose();
    } catch (err: any) {
      const message = err?.message ?? t("errors.failed_to_create_user", "Failed to create user");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalPanel>
      <ModalHeader
        icon={<UserPlus size={22} />}
        title={t("settings.add_user", "Add User")}
        description={t("settings.add_user_desc", "Create a new local Jellystat user account.")}
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label={t("common.username", "Username")} htmlFor="add-user-username" required error={fieldErrors.username}>
          <Input
            id="add-user-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            placeholder={t("common.placeholder_username", "Choose a username")}
            leftIcon={<User size={18} />}
            error={!!fieldErrors.username}
          />
        </Field>

        <Field label={t("common.password", "Password")} htmlFor="add-user-password" required error={fieldErrors.password}>
          <Input
            id="add-user-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            placeholder={t("common.placeholder_create_password", "Create a secure password")}
            leftIcon={<Lock size={18} />}
            error={!!fieldErrors.password}
            rightSlot={
              <InputAction onClick={() => setShowPassword((current) => !current)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </InputAction>
            }
          />
        </Field>

        {error && <ErrorAlert>{error}</ErrorAlert>}

        <ModalFooter>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button type="submit" loading={loading} disabled={!username.trim() || !password.trim()}>
            {loading ? t("common.creating", "Creating") : t("common.create", "Create")}
          </Button>
        </ModalFooter>
      </form>
    </ModalPanel>
  );
}
