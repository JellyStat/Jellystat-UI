import { Container, FloatingIndicator, Tabs, Text, Title } from "@mantine/core";
import { useState } from "react";
import classes from "./settings.index.module.css";

export default function SettingsPage() {
  const [rootRef, setRootRef] = useState<HTMLDivElement | null>(null);
  const [value, setValue] = useState<string | null>("settings");
  const [controlsRefs, setControlsRefs] = useState<Record<string, HTMLButtonElement | null>>({});
  const setControlRef = (val: string) => (node: HTMLButtonElement) => {
    controlsRefs[val] = node;
    setControlsRefs(controlsRefs);
  };
  return (
    <div style={{ padding: 20 }}>
      <Tabs variant="none" value={value} onChange={setValue}>
        <Tabs.List ref={setRootRef} className={classes.list}>
          <Tabs.Tab value="settings" ref={setControlRef("settings")} className={classes.tab}>
            Settings
          </Tabs.Tab>
          <Tabs.Tab value="2" ref={setControlRef("2")} className={classes.tab}>
            Second tab
          </Tabs.Tab>
          <Tabs.Tab value="3" ref={setControlRef("3")} className={classes.tab}>
            Third tab
          </Tabs.Tab>

          <FloatingIndicator target={value ? controlsRefs[value] : null} parent={rootRef} className={classes.indicator} />
        </Tabs.List>

        <Tabs.Panel value="settings">First tab content</Tabs.Panel>
        <Tabs.Panel value="2">Second tab content</Tabs.Panel>
        <Tabs.Panel value="3">Third tab content</Tabs.Panel>
      </Tabs>
    </div>
  );
}
