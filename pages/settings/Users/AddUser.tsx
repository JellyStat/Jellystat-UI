import React, { useState } from "react";
import { AlertCircle, Eye, EyeOff, Loader2, Lock, User, UserPlus } from "lucide-react";
import { DialogPanel, DialogTitle } from "@headlessui/react";
import { toast } from "sonner";
import { useTranslation } from "next-i18next/pages";

import client from "@/lib/api";

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
      nextFieldErrors.username = t("settings.error_username_required", "Username is required");
    }
    if (!password.trim()) {
      nextFieldErrors.password = t("settings.error_password_required", "Password is required");
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
      const message = err?.message ?? t("settings.error_create_user", "Failed to create user");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DialogPanel
      transition
      className="w-full max-w-lg rounded-2xl border border-border bg-surface p-5 md:p-6 shadow-2xl shadow-black/40 duration-100 ease-out data-closed:transform-[scale(95%)] data-closed:opacity-0"
    >
      <DialogTitle className="text-lg font-black text-white">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-purple/10 border border-brand-purple/20">
                <UserPlus size={22} className="text-brand-purple" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">{t("settings.add_user_title", "Add User")}</h2>
            </div>
            <p className="mt-2 text-sm text-gray-400 font-medium">
              {t("settings.add_user_desc", "Create a new local Jellystat user account.")}
            </p>
          </div>
        </div>
      </DialogTitle>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
            {t("settings.label_username", "Username")}
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-500 group-focus-within:text-brand-cyan transition-colors">
              <User size={18} />
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              placeholder={t("settings.placeholder_username", "Choose a username")}
              className={`w-full bg-background border rounded-xl py-3 pl-11 pr-4 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 transition-all shadow-inner ${
                fieldErrors.username
                  ? "border-brand-rose focus:border-brand-rose focus:ring-brand-rose/50"
                  : "border-border hover:border-gray-500 focus:border-brand-cyan focus:ring-brand-cyan"
              }`}
            />
          </div>
          {fieldErrors.username && (
            <p className="text-[11px] font-bold text-brand-rose ml-1 flex items-center mt-1">
              <AlertCircle size={10} className="mr-1" />
              {fieldErrors.username}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
            {t("settings.label_password", "Password")}
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-500 group-focus-within:text-brand-purple transition-colors">
              <Lock size={18} />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder={t("settings.placeholder_password", "Create a secure password")}
              className={`w-full bg-background border rounded-xl py-3 pl-11 pr-12 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 transition-all shadow-inner ${
                fieldErrors.password
                  ? "border-brand-rose focus:border-brand-rose focus:ring-brand-rose/50"
                  : "border-border hover:border-gray-500 focus:border-brand-purple focus:ring-brand-purple"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              tabIndex={-1}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-500 hover:text-gray-300 transition-colors focus:outline-none"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="text-[11px] font-bold text-brand-rose ml-1 flex items-center mt-1">
              <AlertCircle size={10} className="mr-1" />
              {fieldErrors.password}
            </p>
          )}
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-brand-rose/10 border border-brand-rose/20 flex items-start gap-3">
            <AlertCircle size={16} className="text-brand-rose shrink-0 mt-0.5" />
            <p className="text-xs text-brand-rose/90 font-medium leading-relaxed">{error}</p>
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-background border border-border text-gray-200 hover:text-white hover:border-gray-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("common.cancel", "Cancel")}
          </button>
          <button
            type="submit"
            disabled={loading || !username.trim() || !password.trim()}
            className="px-5 py-2.5 rounded-xl bg-brand-purple hover:bg-[#9a2cee] text-white font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-brand-purple/20 active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin mr-2" />
                {t("settings.creating_user", "Creating User...")}
              </>
            ) : (
              t("settings.create_user", "Create User")
            )}
          </button>
        </div>
      </form>
    </DialogPanel>
  );
}
