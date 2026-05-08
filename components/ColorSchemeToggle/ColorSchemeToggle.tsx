import { Button, Group, useMantineColorScheme } from "@mantine/core";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";

export function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme();

  function test() {
    const query = new GridifyQueryBuilder()
      .setPage(2)
      .setPageSize(10)
      .addOrderBy("name", true)
      .startGroup()
      .addCondition("age", op.LessThan, 50)
      .or()
      .addCondition("name", op.StartsWith, "A")
      .endGroup()
      .and()
      .addCondition("isActive", op.Equal, true)
      .build();

    console.log(query);
  }

  function Logout() {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem("jellystat_token");
      localStorage.removeItem("jellystat_refreshToken");
    } catch {
      /* ignore */
    }
    window.location.href = "/login";
  }

  return (
    <Group justify="center" mt="xl">
      <Button onClick={() => setColorScheme("light")}>Light</Button>
      <Button onClick={() => setColorScheme("dark")}>Dark</Button>
      <Button onClick={() => setColorScheme("auto")}>Auto</Button>
      <Button onClick={test}>Test</Button>
      <Button onClick={Logout}>Logout</Button>
    </Group>
  );
}
