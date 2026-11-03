import React, { useState } from "react";
import { UserPlus, User, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import client from "@/lib/api";
import { Button, ErrorAlert, Field, Input, InputAction } from "@/components/ui";
import SetupStep from "./SetupStep";

type Props = { onComplete?: (result?: { username?: string; password?: string }) => void };

export default function CreateUserPage({ onComplete }: Props) {
  const { t } = useTranslation("common");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<{
    username?: string;
    password?: string;
    passwordConfirmation?: string;
  }>({});

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();

    setError(null);
    setFieldErrors({});

    let hasError = false;
    const newFieldErrors: typeof fieldErrors = {};

    if (!username.trim()) {
      newFieldErrors.username = t("common.error_username_required", "Username is required");
      hasError = true;
    }

    if (!password.trim()) {
      newFieldErrors.password = t("common.error_password_required", "Password is required");
      hasError = true;
    }

    if (!passwordConfirmation.trim()) {
      newFieldErrors.passwordConfirmation = t("setup.error_confirm_password", "Please confirm your password");
      hasError = true;
    } else if (password.trim() !== passwordConfirmation.trim()) {
      newFieldErrors.passwordConfirmation = t("setup.error_passwords_mismatch", "Passwords do not match");
      hasError = true;
    }

    if (hasError) {
      setFieldErrors(newFieldErrors);
      return;
    }

    setLoading(true);
    try {
      await client.Auth.createUser({ username: username.trim(), password: password.trim() });
      toast.success(t("setup.toast_admin_created", "Local administrator account created"));
      onComplete?.({ username: username.trim(), password: password.trim() });
    } catch (err: any) {
      const errMsg = err?.message ?? t("setup.error_registration_failed", "Registration failed. Please try again.");
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SetupStep
      gradient="from-primary to-success"
      glow="-top-24 -left-24 bg-primary/10"
      icon={<UserPlus size={32} />}
      title={t("setup.create_account_title", "Create Account")}
      description={t("setup.create_account_desc", "Set up your local administrator credentials for Jellystat.")}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label={t("common.username", "Username")} htmlFor="setup-username" error={fieldErrors.username}>
          <Input
            id="setup-username"
            type="text"
            placeholder={t("setup.placeholder_username", "Choose a username")}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            leftIcon={<User size={18} />}
            error={!!fieldErrors.username}
          />
        </Field>

        <Field label={t("common.password", "Password")} htmlFor="setup-password" error={fieldErrors.password}>
          <Input
            id="setup-password"
            type={showPassword ? "text" : "password"}
            placeholder={t("setup.placeholder_password", "Create a secure password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            leftIcon={<Lock size={18} />}
            error={!!fieldErrors.password}
            rightSlot={
              <InputAction onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </InputAction>
            }
          />
        </Field>

        <Field
          label={t("setup.label_confirm_password", "Confirm Password")}
          htmlFor="setup-password-confirm"
          error={fieldErrors.passwordConfirmation}
        >
          <Input
            id="setup-password-confirm"
            type={showPassword ? "text" : "password"}
            placeholder={t("setup.placeholder_confirm_password", "Verify your password")}
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            disabled={loading}
            leftIcon={<ShieldCheck size={18} />}
            error={!!fieldErrors.passwordConfirmation}
          />
        </Field>

        {error && <ErrorAlert>{error}</ErrorAlert>}

        <div className="pt-4">
          <Button
            type="submit"
            size="lg"
            className="w-full"
            loading={loading}
            disabled={!username.trim() || !password.trim() || !passwordConfirmation.trim()}
          >
            {loading ? t("setup.btn_creating", "Creating Account...") : t("setup.btn_register", "Register Administrator")}
          </Button>
        </div>
      </form>
    </SetupStep>
  );
}
