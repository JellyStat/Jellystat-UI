import React, { useState } from "react";
import { Server as ServerIcon, Link as LinkIcon, Globe, Key, Eye, EyeOff, Database } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import client from "@/lib/api";
import { AddServer } from "@/lib/models/addServer";
import { Server } from "@/lib/models/server";
import ServerType from "@/lib/models/enums/serverTypes";
import { Button, ErrorAlert, Field, Input, InputAction, Select } from "@/components/ui";
import SetupStep from "./SetupStep";

type Props = { onComplete?: (result?: { server?: Server }) => void };

export default function CreateServerPage({ onComplete }: Props) {
  const { t } = useTranslation("common");

  // --- STATE ---
  const [url, setUrl] = useState("");
  const [externalUrl, setExternalUrl] = useState<string>("");
  const [apiKey, setApiKey] = useState("");
  const [type, setType] = useState<ServerType>(ServerType.Jellyfin);
  const [showApiKey, setShowApiKey] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ url?: string; apiKey?: string }>({});

  // --- HANDLERS ---
  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();

    setError(null);
    setFieldErrors({});

    let hasError = false;
    const newFieldErrors: { url?: string; apiKey?: string } = {};

    if (!url.trim()) {
      newFieldErrors.url = t("errors.url_is_required", "URL is required");
      hasError = true;
    }

    if (!apiKey.trim()) {
      newFieldErrors.apiKey = t("errors.api_key_is_required", "API key is required");
      hasError = true;
    }

    if (hasError) {
      setFieldErrors(newFieldErrors);
      return;
    }

    setLoading(true);
    try {
      const serverPayload: AddServer = {
        url: url.trim(),
        externalURL: externalUrl.trim() || undefined,
        apiKey: apiKey.trim(),
        type: type,
      };

      const server = await client.Api.addServer(serverPayload);
      toast.success(t("setup.toast_server_connected", "Server connected successfully!"));
      onComplete?.({ server });
    } catch (err: any) {
      const errMsg = err?.message ?? t("errors.unable_to_add_server_check_your_url_and", "Unable to add server. Check your URL and API Key.");
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SetupStep
      gradient="from-accent to-primary"
      glow="-top-24 -right-24 bg-accent/10"
      icon={<Database size={32} />}
      title={t("setup.connect_server_title", "Connect Server")}
      description={t("setup.connect_server_desc", "Link your Jellyfin or Emby instance to begin tracking telemetry.")}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label={t("setup.label_platform", "Platform")}>
          <Select<ServerType>
            data={Object.values(ServerType).map((value) => ({ value }))}
            value={type}
            onChange={setType}
            labelFn={(value) => value}
            leftIcon={ServerIcon}
            disabled={loading}
            widthPx={0}
            className="w-full"
          />
        </Field>

        <Field label={t("setup.label_local_url", "Local URL")} htmlFor="setup-url" error={fieldErrors.url}>
          <Input
            id="setup-url"
            type="text"
            placeholder={t("setup.placeholder_local_url", "http://localhost:8096")}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
            leftIcon={<LinkIcon size={18} />}
            error={!!fieldErrors.url}
          />
        </Field>

        <Field
          label={t("settings.label_external_url", "External URL")}
          htmlFor="setup-external-url"
          hint={t("setup.label_optional", "Optional")}
        >
          <Input
            id="setup-external-url"
            type="text"
            placeholder={t("setup.placeholder_external_url", "https://media.yourdomain.com")}
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            disabled={loading}
            leftIcon={<Globe size={18} />}
          />
        </Field>

        <Field label={t("common.api_key", "API Key")} htmlFor="setup-api-key" error={fieldErrors.apiKey}>
          <Input
            id="setup-api-key"
            type={showApiKey ? "text" : "password"}
            placeholder={t("common.placeholder_api_key", "Enter server API key")}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            disabled={loading}
            leftIcon={<Key size={18} />}
            error={!!fieldErrors.apiKey}
            rightSlot={
              <InputAction onClick={() => setShowApiKey(!showApiKey)}>
                {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </InputAction>
            }
          />
        </Field>

        {error && <ErrorAlert>{error}</ErrorAlert>}

        <div className="pt-4">
          <Button
            type="submit"
            size="lg"
            className="w-full"
            loading={loading}
            disabled={!url.trim() || !apiKey.trim()}
          >
            {loading ? t("setup.btn_connecting", "Connecting") : t("common.add_server", "Add Server")}
          </Button>
        </div>
      </form>
    </SetupStep>
  );
}
