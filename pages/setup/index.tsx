import SystemState from "@/lib/models/enums/systemState";
import { Button, Center, Container, Group, Stepper } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import CreateUserPage from "./createUser";
import client from "@/lib/api";
import { IconServer, IconUser } from "@tabler/icons-react";
import SetupCompletePage from "./setupComplete";
import CreateServerPage from "./createServerInstance";
import { processServerId, setToken } from "@/lib/helpers/tokenHelper";

export default function SetupPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const order = useMemo(() => [SystemState.Unconfigured, SystemState.FirstUserCreated, SystemState.Configured], []);

  const [systemState, setSystemState] = useState<SystemState>(SystemState.Unconfigured);

  const activeIndex = order.indexOf(systemState);

  const nextStep = () => setSystemState((current) => order[Math.min(order.indexOf(current) + 1, order.length - 1)]);

  const prevStep = () => setSystemState((current) => order[Math.max(order.indexOf(current) - 1, 0)]);

  const fetchSystem = async (suppressLoader = false) => {
    if (!suppressLoader) {
      setLoading(true);
    }
    setError(null);
    try {
      const info = await client.System.getSystemInfo();
      setSystemState(info?.state ?? SystemState.Unconfigured);
    } catch (err: any) {
      let msg = err?.message ?? String(err ?? "Unknown error");
      if (err instanceof client.ApiError) {
        msg = `${err.message} (${err.status} ${err.statusText})`;
      }

      setError(msg);
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSystem();
  }, []);

  return (
    <Container h={"100%"} w={"100%"} p={0}>
      <Center style={{ flexDirection: "column" }}>
        <Stepper active={activeIndex} style={{ marginTop: "20%", width: "75%" }}>
          <Stepper.Step icon={<IconUser size={18} />} label="Create user" description="Create an account">
            <CreateUserPage
              onComplete={async (result) => {
                const token = await client.Auth.login({ username: result?.username ?? "", password: result?.password ?? "" });
                const tokenSet = await setToken(token);
                if (!tokenSet) {
                  setError("Login succeeded but failed to persist token");
                  setLoading(false);
                  return;
                }
                fetchSystem(true);
              }}
            />
          </Stepper.Step>
          <Stepper.Step icon={<IconServer size={18} />} label="Add a server" description="Add a Jellyfin/Emby Server ">
            <CreateServerPage
              onComplete={async (result) => {
                console.log("Server added", result);
                await processServerId(result?.server?.id);
                fetchSystem(true);
              }}
            />
          </Stepper.Step>

          <Stepper.Completed>
            <SetupCompletePage />
          </Stepper.Completed>
        </Stepper>

        {/* <Group justify="center" mt="xl">
          <Button variant="default" onClick={prevStep}>
            Back
          </Button>
          <Button onClick={nextStep}>Next step</Button>
        </Group> */}
      </Center>
    </Container>
  );
}
