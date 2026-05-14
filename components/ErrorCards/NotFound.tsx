import React from "react";
import { Card, Title, Text, Button, Group, Center } from "@mantine/core";
import { useRouter } from "next/router";
import { IconQuestionMark, IconZoomQuestion } from "@tabler/icons-react";

export interface NotFoundProps {
  title?: string;
  message?: string;
  enableGoBack?: boolean;
}

export default function NotFound({
  title = "Not Found",
  message = "The requested resource could not be found.",
  enableGoBack = true,
}: NotFoundProps) {
  const router = useRouter();

  return (
    <Center style={{ width: "100%", height: "100%" }}>
      <Card orientation="horizontal" shadow="sm" radius="md" style={{ maxWidth: 720, width: "100%" }}>
        <Card.Section>
          <Center p={20} style={{ width: "100%", height: "100%" }}>
            <IconZoomQuestion size={64} />
          </Center>
        </Card.Section>
        <Card.Section p={20}>
          <Title order={3} style={{ marginBottom: 8 }}>
            {title}
          </Title>
          <Text color="dimmed" style={{ marginBottom: 16 }}>
            {message}
          </Text>

          {enableGoBack && (
            <Group style={{ alignItems: "start" }}>
              <Button onClick={() => router.back()}>Go Back</Button>
            </Group>
          )}
        </Card.Section>
      </Card>
    </Center>
  );
}
