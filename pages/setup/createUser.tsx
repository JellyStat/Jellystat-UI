import React, { useState } from "react";
import { 
  UserPlus, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Loader2, 
  ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "next-i18next/pages";

import client from "@/lib/api";

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
    passwordConfirmation?: string 
  }>({});

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    
    setError(null);
    setFieldErrors({});
    
    let hasError = false;
    const newFieldErrors: typeof fieldErrors = {};

    if (!username.trim()) {
      newFieldErrors.username = t("setup.error_username_required", "Username is required");
      hasError = true;
    }
    
    if (!password.trim()) {
      newFieldErrors.password = t("setup.error_password_required", "Password is required");
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
    <div className="w-full max-w-md mx-auto animate-in zoom-in-95 fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-brand-purple to-brand-emerald rounded-2xl flex items-center justify-center shadow-lg shadow-brand-purple/20 mb-6 border border-white/10">
          <UserPlus className="text-white" size={32} />
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight mb-2">
          {t("setup.create_account_title", "Create Account")}
        </h2>
        <p className="text-sm text-gray-400 font-medium">
          {t("setup.create_account_desc", "Set up your local administrator credentials for Jellystat.")}
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-surface/60 backdrop-blur-xl border border-border rounded-3xl shadow-2xl shadow-black/40 p-6 md:p-8 relative overflow-hidden">
        
        {/* Ambient Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-purple/10 blur-[80px] pointer-events-none rounded-full"></div>

        <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
              {t("setup.label_username", "Username")}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-500 group-focus-within:text-brand-cyan transition-colors">
                <User size={18} />
              </div>
              <input
                type="text"
                placeholder={t("setup.placeholder_username", "Choose a username")}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className={`w-full bg-background border rounded-xl py-3 pl-11 pr-4 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 transition-all shadow-inner ${
                  fieldErrors.username ? "border-brand-rose focus:border-brand-rose focus:ring-brand-rose/50" : "border-border hover:border-gray-500 focus:border-brand-cyan focus:ring-brand-cyan"
                }`}
              />
            </div>
            {fieldErrors.username && <p className="text-[11px] font-bold text-brand-rose ml-1 flex items-center mt-1"><AlertCircle size={10} className="mr-1" /> {fieldErrors.username}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
              {t("setup.label_password", "Password")}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-500 group-focus-within:text-brand-purple transition-colors">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder={t("setup.placeholder_password", "Create a secure password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className={`w-full bg-background border rounded-xl py-3 pl-11 pr-12 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 transition-all shadow-inner ${
                  fieldErrors.password ? "border-brand-rose focus:border-brand-rose focus:ring-brand-rose/50" : "border-border hover:border-gray-500 focus:border-brand-purple focus:ring-brand-purple"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-500 hover:text-gray-300 transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.password && <p className="text-[11px] font-bold text-brand-rose ml-1 flex items-center mt-1"><AlertCircle size={10} className="mr-1" /> {fieldErrors.password}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
              {t("setup.label_confirm_password", "Confirm Password")}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-500 group-focus-within:text-brand-emerald transition-colors">
                <ShieldCheck size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder={t("setup.placeholder_confirm_password", "Verify your password")}
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                disabled={loading}
                className={`w-full bg-background border rounded-xl py-3 pl-11 pr-4 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 transition-all shadow-inner ${
                  fieldErrors.passwordConfirmation ? "border-brand-rose focus:border-brand-rose focus:ring-brand-rose/50" : "border-border hover:border-gray-500 focus:border-brand-emerald focus:ring-brand-emerald"
                }`}
              />
            </div>
            {fieldErrors.passwordConfirmation && <p className="text-[11px] font-bold text-brand-rose ml-1 flex items-center mt-1"><AlertCircle size={10} className="mr-1" /> {fieldErrors.passwordConfirmation}</p>}
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-brand-rose/10 border border-brand-rose/20 flex items-start gap-3 mt-4">
              <AlertCircle size={16} className="text-brand-rose shrink-0 mt-0.5" />
              <p className="text-xs text-brand-rose/90 font-medium leading-relaxed">{error}</p>
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || !username.trim() || !password.trim() || !passwordConfirmation.trim()}
              className="w-full bg-brand-purple hover:bg-[#9a2cee] text-white font-black py-3.5 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-brand-purple/20 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin mr-2" />
                  {t("setup.btn_creating", "Creating Account...")}
                </>
              ) : (
                t("setup.btn_register", "Register Administrator")
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}