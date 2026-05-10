import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { TextInput, PasswordInput, Button, Container, Title, Text, Space, Select, Loader, Center } from "@mantine/core";
import client from "@/lib/api";

type Props = { onComplete?: (result?: { username?: string }) => void };

export default function CreateUserPage({ onComplete }: Props) {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordConfirmationError, setPasswordConfirmationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  async function handleSubmit() {
    setError(null);
    setUsernameError(null);
    setPasswordError(null);
    setPasswordConfirmationError(null);
    setLoading(true);
    try {
      // Validate visible fields
      await sleep(2000);
      let hasError = false;
      if (!username.trim()) {
        setUsernameError("Username is required");
        hasError = true;
      }
      if (!password.trim()) {
        setPasswordError("Password is required");
        hasError = true;
      }

      if (!passwordConfirmation.trim()) {
        setPasswordConfirmationError("Password confirmation is required");
        hasError = true;
      }

      if (password.trim() !== passwordConfirmation.trim()) {
        setPasswordConfirmationError("Passwords do not match");
        hasError = true;
      }

      if (hasError) {
        setLoading(false);
        return;
      }
      await client.Auth.createUser({ username, password });
      onComplete?.({ username });
    } catch (err: any) {
      setError(err?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  const hasError = usernameError || passwordError || passwordConfirmationError || error;

  return (
    <Container size={420} my={40}>
      <Center style={{ flexDirection: "column" }}>
        <Title order={2}>Create a Local Account</Title>
      </Center>
      <>
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

        <PasswordInput
          label="Confirm Password"
          placeholder="Confirm Password"
          required
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.currentTarget.value)}
          mt="sm"
        />

        {hasError && (
          <Text color="red" size="sm" mt="sm">
            {error ?? usernameError ?? passwordError ?? passwordConfirmationError}
          </Text>
        )}

        <Space h="md" />
        <Button
          type="submit"
          fullWidth
          loading={loading}
          onClick={handleSubmit}
          disabled={loading || !username.trim() || !password.trim() || !passwordConfirmation.trim()}
        >
          Register
        </Button>
      </>
    </Container>
  );
}
