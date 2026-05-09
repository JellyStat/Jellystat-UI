import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { TextInput, PasswordInput, Button, Container, Title, Text, Space, Select, Loader } from "@mantine/core";
import { login, getConfig } from "../lib/api";
import { wsClient } from "../lib/wsClient";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const token = localStorage.getItem("jellystat_token");
      if (token) {
        router.replace("/");
      }
    } catch {
      /* ignore */
    }
  }, [router]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showServerPicker, setShowServerPicker] = useState(false);
  const [serverOptions, setServerOptions] = useState<{ value: string; label: string }[]>([]);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [loadingServers, setLoadingServers] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [serverValidationError, setServerValidationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setUsernameError(null);
    setPasswordError(null);
    setServerValidationError(null);
    setLoading(true);
    try {
      // Validate visible fields
      let hasError = false;
      if (!username.trim()) {
        setUsernameError("Username is required");
        hasError = true;
      }
      if (!password.trim()) {
        setPasswordError("Password is required");
        hasError = true;
      }
      if (showServerPicker && !selectedServer) {
        setServerValidationError("Server is required");
        hasError = true;
      }

      if (hasError) {
        setLoading(false);
        return;
      }

      const serverId = selectedServer ?? undefined;
      await login({ username, password, serverId });
      try {
        wsClient.init();
      } catch {
        /* ignore ws init failures */
      }
      router.push("/");
    } catch (err: any) {
      setError(err?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function loadServers() {
    setLoadingServers(true);
    setServerError(null);
    try {
      const list = await getConfig();
      const opts = (list ?? []).map((s: any) => ({ value: s.id, label: `${s.type} - ${s.name}` }));
      setServerOptions(opts);
    } catch (err: any) {
      setServerError(err?.message ?? "Failed to load servers");
    } finally {
      setLoadingServers(false);
    }
  }

  function toggleServerPicker() {
    if (showServerPicker) {
      setShowServerPicker(false);
      setSelectedServer(null);
      try {
        localStorage.removeItem("jellystat_serverId");
      } catch {
        /* ignore */
      }
    } else {
      setShowServerPicker(true);
      if (serverOptions.length === 0) loadServers();
    }
  }

  return (
    <Container size={420} my={40}>
      <Title order={2} align="center">
        Sign in
      </Title>
      <Text color="dimmed" size="sm" align="center" mt={5}>
        Enter your credentials to continue
      </Text>

      <form onSubmit={handleSubmit}>
        <TextInput
          label="Username"
          placeholder="Username"
          required
          value={username}
          onChange={(e) => setUsername(e.currentTarget.value)}
          mt="xl"
        />

        <PasswordInput
          label="Password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
          mt="sm"
        />

        {showServerPicker && (
          <>
            {loadingServers ? (
              <Loader />
            ) : serverError ? (
              <Text color="red" size="sm" mt="sm">
                {serverError}
              </Text>
            ) : (
              <Select
                label="Server"
                required
                placeholder={serverOptions.length ? "Select server" : "No servers found"}
                data={serverOptions}
                value={selectedServer}
                onChange={(v) => {
                  setSelectedServer(v);
                  setServerValidationError(null);
                  try {
                    if (v) localStorage.setItem("jellystat_serverId", v);
                    else localStorage.removeItem("jellystat_serverId");
                  } catch {
                    /* ignore */
                  }
                }}
                searchable
                nothingFound="No matching servers"
                mt="sm"
              />
            )}
          </>
        )}

        {error && (
          <Text color="red" size="sm" mt="sm">
            {error}
          </Text>
        )}

        {usernameError && (
          <Text color="red" size="sm" mt="sm">
            {usernameError}
          </Text>
        )}
        {passwordError && (
          <Text color="red" size="sm" mt="sm">
            {passwordError}
          </Text>
        )}
        {serverValidationError && (
          <Text color="red" size="sm" mt="sm">
            {serverValidationError}
          </Text>
        )}

        <Space h="md" />
        <Button
          type="submit"
          fullWidth
          loading={loading}
          onClick={handleSubmit}
          disabled={loading || !username.trim() || !password.trim() || (showServerPicker && !selectedServer)}
        >
          Sign in
        </Button>

        <Space h="sm" />
        <Button variant="outline" fullWidth onClick={toggleServerPicker}>
          {showServerPicker ? "Login with Local Account" : "Login with Jellyfin/Emby"}
        </Button>
      </form>
    </Container>
  );
}
