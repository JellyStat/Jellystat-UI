import React, { useState } from "react";
import { Eye, EyeOff, Globe, Link as LinkIcon, Lock, ServerCog } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import client from "@/lib/api";
import ServerType from "@/lib/models/enums/serverTypes";
import { AddServer } from "@/lib/models/addServer";
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
  onClose: () => void;
  onCreated?: () => void;
};

export default function AddServerModal({ onClose, onCreated }: Props) {
  const { t } = useTranslation("common");

  const [Url, setUrl] = useState("");
  const [ApiKey, setApiKey] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [serverType, setServerType] = useState(ServerType.Jellyfin);
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ Url?: string; ApiKey?: string }>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError(null);
    setFieldErrors({});

    const nextFieldErrors: typeof fieldErrors = {};
    if (!Url.trim()) {
      nextFieldErrors.Url = t("common.error_url_required", "URL is required");
    }
    if (!ApiKey.trim()) {
      nextFieldErrors.ApiKey = t("common.error_api_key_required", "API Key is required");
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setLoading(true);
    try {
      const payload: AddServer = { url: Url.trim(), apiKey: ApiKey.trim(), externalURL: undefined, type: serverType };
      if (externalUrl.trim() !== "") {
        payload.externalURL = externalUrl.trim();
      }
      await client.Api.addServer(payload);
      toast.success(t("settings.toast_server_created", "Server created successfully"));
      onCreated?.();
      onClose();
    } catch (err: any) {
      const message = err?.message ?? t("settings.error_create_server", "Failed to create server");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalPanel>
      <ModalHeader
        icon={<ServerCog size={22} />}
        title={t("settings.add_server", "Add Server")}
        description={t("settings.add_server_desc", "Add a new Jellyfin or Emby server to monitor.")}
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label={t("common.url", "URL")} htmlFor="add-server-url" error={fieldErrors.Url}>
          <Input
            id="add-server-url"
            type="text"
            value={Url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
            placeholder={t("settings.placeholder_url", "Enter the server URL")}
            leftIcon={<LinkIcon size={18} />}
            error={!!fieldErrors.Url}
          />
        </Field>

        <Field label={t("settings.label_external_url", "External URL")} htmlFor="add-server-external-url">
          <Input
            id="add-server-external-url"
            type="text"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            disabled={loading}
            placeholder={t("settings.placeholder_url", "Enter the server URL")}
            leftIcon={<Globe size={18} />}
          />
        </Field>

        <Field label={t("common.api_key", "API Key")} htmlFor="add-server-api-key" error={fieldErrors.ApiKey}>
          <Input
            id="add-server-api-key"
            type={showApiKey ? "text" : "password"}
            value={ApiKey}
            onChange={(e) => setApiKey(e.target.value)}
            disabled={loading}
            placeholder={t("settings.placeholder_api_key", "Enter your API key")}
            leftIcon={<Lock size={18} />}
            error={!!fieldErrors.ApiKey}
            rightSlot={
              <InputAction onClick={() => setShowApiKey((current) => !current)}>
                {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </InputAction>
            }
          />
        </Field>

        <Field label={t("settings.label_server_type", "Server Type")}>
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
          <Button type="submit" loading={loading} disabled={!Url.trim() || !ApiKey.trim()}>
            {loading ? t("settings.adding_server", "Adding Server") : t("settings.add_server", "Add Server")}
          </Button>
        </ModalFooter>
      </form>
    </ModalPanel>
  );
}
