import React, { useState } from "react";
import { Eye, EyeOff, Globe, Link as LinkIcon, Lock, Server as ServerIcon, SquarePen } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import client from "@/lib/api";
import ServerType from "@/lib/models/enums/serverTypes";
import type { AddServer } from "@/lib/models/addServer";
import type { Server } from "@/lib/models/server";
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
} from "@/components/ui";

type Props = {
  server: Server;
  onClose: () => void;
  onSaved?: () => void;
};

export default function EditServerModal({ server, onClose, onSaved }: Props) {
  const { t } = useTranslation("common");

  const [url, setUrl] = useState(server.url ?? "");
  const [externalUrl, setExternalUrl] = useState(server.externalURL ?? "");
  const [apiKey, setApiKey] = useState("");
  const [serverType, setServerType] = useState<ServerType>((server.type as ServerType) ?? ServerType.Jellyfin);
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ url?: string }>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!url.trim()) {
      setFieldErrors({ url: t("common.error_url_required", "URL is required") });
      return;
    }

    setLoading(true);
    try {
      const payload: AddServer = {
        id: server.id,
        url: url.trim(),
        // an empty external URL clears it; an empty API key keeps the stored one
        externalURL: externalUrl.trim(),
        apiKey: apiKey.trim() || undefined,
        type: serverType as AddServer["type"],
      };
      await client.Api.addServer(payload);
      toast.success(t("settings.toast_server_updated", "Server updated successfully"));
      onSaved?.();
      onClose();
    } catch (err: any) {
      const message = err?.message ?? t("settings.error_update_server", "Failed to update server");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalPanel>
      <ModalHeader
        icon={<SquarePen size={22} />}
        title={t("settings.edit_server", "Edit Server")}
        description={t("settings.edit_server_desc", "Update how Jellystat connects to {{name}}.", { name: server.name })}
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field
          label={t("settings.label_server_name", "Name")}
          htmlFor="edit-server-name"
          description={t("settings.server_name_note", "The name comes from the server itself and is updated automatically.")}
        >
          <Input id="edit-server-name" type="text" value={server.name} readOnly disabled leftIcon={<ServerIcon size={18} />} />
        </Field>

        <Field label={t("common.url", "URL")} htmlFor="edit-server-url" error={fieldErrors.url}>
          <Input
            id="edit-server-url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
            placeholder={t("settings.placeholder_url", "Enter the server URL")}
            leftIcon={<LinkIcon size={18} />}
            error={!!fieldErrors.url}
          />
        </Field>

        <Field label={t("settings.label_external_url", "External URL")} htmlFor="edit-server-external-url">
          <Input
            id="edit-server-external-url"
            type="text"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            disabled={loading}
            placeholder={t("settings.placeholder_external_url", "Optional. Leave empty to remove")}
            leftIcon={<Globe size={18} />}
          />
        </Field>

        <Field label={t("common.api_key", "API Key")} htmlFor="edit-server-api-key">
          <Input
            id="edit-server-api-key"
            type={showApiKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            disabled={loading}
            autoComplete="off"
            placeholder={t("settings.placeholder_api_key_keep", "Leave blank to keep the current key")}
            leftIcon={<Lock size={18} />}
            rightSlot={
              <InputAction onClick={() => setShowApiKey((current) => !current)}>
                {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </InputAction>
            }
          />
        </Field>

        <Field
          label={t("settings.label_server_type", "Server Type")}
          description={t(
            "settings.edit_server_verify_note",
            "The connection is tested when you save. Your sync schedules and remote authentication setting are kept.",
          )}
        >
          <Select
            data={[{ value: ServerType.Jellyfin }, { value: ServerType.Emby }]}
            value={serverType}
            onChange={(val) => setServerType(val as ServerType)}
            labelFn={(val) => {
              if (val === ServerType.Jellyfin) return "Jellyfin";
              if (val === ServerType.Emby) return "Emby";
              return "";
            }}
            disabled={loading}
            widthPx={0}
            className="w-full"
          />
        </Field>

        {error && <ErrorAlert>{error}</ErrorAlert>}

        <ModalFooter>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button type="submit" loading={loading} disabled={!url.trim()}>
            {loading ? t("settings.saving_server", "Saving") : t("common.save", "Save")}
          </Button>
        </ModalFooter>
      </form>
    </ModalPanel>
  );
}
