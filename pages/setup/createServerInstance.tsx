import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { TextInput, PasswordInput, Button, Container, Title, Text, Space, Select, Loader, Center } from "@mantine/core";
import client from "@/lib/api";
import { AddServer } from "@/lib/models/addServer";
import { Server } from "@/lib/models/server";
import ServerType from "@/lib/models/enums/serverTypes";

type Props = { onComplete?: (result?: { server?: Server }) => void };

export default function CreateServerPage({ onComplete }: Props) {
  const router = useRouter();

  const [url, setUrl] = useState("");
  const [externalUrl, setExternalUrl] = useState<string | undefined>(undefined);
  const [apiKey, setApiKey] = useState("");
  const [type, setType] = useState<ServerType>(ServerType.Jellyfin);

  const [urlError, setUrlError] = useState<string | null>(null);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  async function handleSubmit() {
    setError(null);
    setUrlError(null);
    setApiKeyError(null);
    setLoading(true);
    try {
      // Validate visible fields
      await sleep(2000);
      let hasError = false;
      if (!url.trim()) {
        setUrlError("URL is required");
        hasError = true;
      }

      if (!apiKey.trim()) {
        setApiKeyError("API key is required");
        hasError = true;
      }

      if (hasError) {
        setLoading(false);
        return;
      }
      const serverPayload: AddServer = { url: url, externalURL: externalUrl, apiKey: apiKey, type: type };
      const server = await client.Api.addServer(serverPayload);
      onComplete?.({ server });
    } catch (err: any) {
      setError(err?.message ?? "Unable to add server");
    } finally {
      setLoading(false);
    }
  }

  const hasError = urlError || apiKeyError || error;

  return (
    <Container size={420} my={40}>
      <Center style={{ flexDirection: "column" }}>
        <Title order={2}>Create a Local Account</Title>
      </Center>
      <>
        <TextInput
          label="URL"
          placeholder="URL of the media server (e.g. http://localhost:8096)"
          required
          value={url}
          onChange={(e) => setUrl(e.currentTarget.value)}
          mt="xl"
        />

        <TextInput
          label="External URL"
          placeholder="External URL of the media server (e.g. https://example.com)"
          value={externalUrl}
          onChange={(e) => setExternalUrl(e.currentTarget.value)}
          mt="xl"
        />

        <PasswordInput
          label="API Key"
          placeholder="API Key"
          required
          value={apiKey}
          onChange={(e) => setApiKey(e.currentTarget.value)}
          mt="sm"
        />

        <Select
          label="Server"
          required
          data={Object.values(ServerType).map((t) => ({ value: t, label: t }))}
          value={type}
          onChange={(v) => {
            setType(v as ServerType);
          }}
          mt="sm"
        />

        {hasError && (
          <Text color="red" size="sm" mt="sm">
            {error ?? urlError ?? apiKeyError}
          </Text>
        )}

        <Space h="md" />
        <Button
          type="submit"
          fullWidth
          loading={loading}
          onClick={handleSubmit}
          disabled={loading || !url.trim() || !apiKey.trim()}
        >
          Add Server
        </Button>
      </>
    </Container>
  );
}
