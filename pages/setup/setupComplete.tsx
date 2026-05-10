import { Button, Center, Container, Text, Title } from "@mantine/core";
import { useRouter } from "next/router";

export default function SetupCompletePage() {
  const router = useRouter();

  return (
    <Container size={420} my={40}>
      <Center style={{ flexDirection: "column" }}>
        <Title>
          <Text inherit variant="gradient" component="span" gradient={{ from: "cyan", to: "green" }}>
            Setup Complete
          </Text>
        </Title>
        <Button mt="xl" onClick={() => router.push("/login")}>
          Go to Login
        </Button>
      </Center>
    </Container>
  );
}
