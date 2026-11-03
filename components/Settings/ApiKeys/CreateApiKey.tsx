import React, { useState } from "react";
import { Check, Copy, Eye, KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import client from "@/lib/api";
import Permissions from "@/lib/models/enums/Permissions";
import type { CreatedApiKey } from "@/lib/models/apiKey";
import type { Server } from "@/lib/models/server";
import {
  Alert,
  Button,
  cn,
  ErrorAlert,
  Field,
  Input,
  Label,
  ModalFooter,
  ModalHeader,
  ModalPanel,
  Select,
} from "@/components/ui";

type Props = {
  servers: Server[];
  onClose: () => void;
  onCreated?: () => void;
};

export default function CreateApiKeyModal({ servers, onClose, onCreated }: Props) {
  const { t } = useTranslation("common");

  const [name, setName] = useState("");
  const [permission, setPermission] = useState<Permissions>(Permissions.CanView);
  const [serverId, setServerId] = useState(servers[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; serverId?: string }>({});
  const [created, setCreated] = useState<CreatedApiKey | null>(null);
  const [copied, setCopied] = useState(false);

  const isReadOnly = permission === Permissions.CanView;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const nextFieldErrors: typeof fieldErrors = {};
    if (!name.trim()) nextFieldErrors.name = t("settings.error_api_key_name_required", "A name is required");
    if (isReadOnly && !serverId)
      nextFieldErrors.serverId = t("settings.error_api_key_server_required", "Select a server for this key");
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) return;

    setLoading(true);
    try {
      const result = await client.ApiKeys.create({
        name: name.trim(),
        permission,
        serverId: isReadOnly ? serverId : undefined,
      });
      setCreated(result);
      onCreated?.();
    } catch (err: any) {
      const message = err?.message ?? t("settings.error_create_api_key", "Failed to create API key");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function copyKey() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("settings.error_copy_api_key", "Could not copy. Select the key and copy it manually."));
    }
  }

  if (created) {
    return (
      <ModalPanel>
        <ModalHeader icon={<KeyRound size={22} />} iconTone="success" title={t("settings.api_key_created", "API key created")} />

        <Alert tone="warning" className="mb-4">
          {t(
            "settings.api_key_copy_warning",
            "Copy this key now. It is only shown once and cannot be retrieved later. If you lose it, delete the key and create a new one.",
          )}
        </Alert>

        <div className="flex items-stretch gap-2">
          <code className="flex-1 min-w-0 break-all bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-gray-200 select-all shadow-inner">
            {created.key}
          </code>
          <Button variant="secondary" onClick={copyKey}>
            {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
            {copied ? t("common.copied", "Copied") : t("common.copy", "Copy")}
          </Button>
        </div>

        <p className="mt-4 text-xs text-gray-500">
          {t("settings.api_key_usage", "Send it in the x-api-token header with each request.")}
        </p>

        <ModalFooter className="pt-5">
          <Button onClick={onClose}>{t("common.done", "Done")}</Button>
        </ModalFooter>
      </ModalPanel>
    );
  }

  const accessOptions = [
    {
      value: Permissions.CanView,
      icon: Eye,
      title: t("settings.api_key_read_only", "Read only"),
      desc: t("settings.api_key_read_only_desc", "View statistics for one server."),
    },
    {
      value: Permissions.Administrator,
      icon: ShieldCheck,
      title: t("settings.api_key_admin", "Full admin"),
      desc: t("settings.api_key_admin_desc", "Everything an administrator can do."),
    },
  ];

  return (
    <ModalPanel>
      <ModalHeader
        icon={<KeyRound size={22} />}
        title={t("settings.add_api_key", "Create API Key")}
        description={t("settings.add_api_key_desc", "Give another app access to Jellystat without a user login.")}
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label={t("settings.api_key_name", "Name")} htmlFor="api-key-name" error={fieldErrors.name}>
          <Input
            id="api-key-name"
            type="text"
            value={name}
            maxLength={100}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            placeholder={t("settings.placeholder_api_key_name", "e.g. Homepage dashboard")}
            error={!!fieldErrors.name}
          />
        </Field>

        <div className="space-y-1.5">
          <Label>{t("settings.api_key_access", "Access")}</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {accessOptions.map((opt) => {
              const Icon = opt.icon;
              const active = permission === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={active}
                  disabled={loading}
                  onClick={() => setPermission(opt.value)}
                  className={cn(
                    "text-left p-4 rounded-xl border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
                    active ? "border-primary bg-primary/10" : "border-border bg-background hover:border-border-strong",
                  )}
                >
                  <div className="flex items-center gap-2 font-bold text-sm text-white">
                    <Icon size={16} className={active ? "text-primary" : "text-gray-500"} />
                    {opt.title}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{opt.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {isReadOnly && (
          <Field label={t("settings.api_key_server", "Server")} error={fieldErrors.serverId}>
            <Select<string>
              data={servers.map((s) => ({ value: s.id }))}
              value={serverId || undefined}
              onChange={setServerId}
              labelFn={(id) => servers.find((s) => s.id === id)?.name ?? id}
              disabled={loading}
              widthPx={0}
              className="w-full"
            />
          </Field>
        )}

        {!isReadOnly && (
          <Alert tone="warning">
            {t(
              "settings.api_key_admin_warning",
              "A full admin key can change settings and delete data on every server. Only use it for apps you fully trust.",
            )}
          </Alert>
        )}

        {error && <ErrorAlert>{error}</ErrorAlert>}

        <ModalFooter>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button type="submit" loading={loading} disabled={!name.trim()}>
            {loading ? t("settings.creating_api_key", "Creating") : t("settings.create_api_key", "Create")}
          </Button>
        </ModalFooter>
      </form>
    </ModalPanel>
  );
}
