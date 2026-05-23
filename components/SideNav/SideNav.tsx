import { useRouter } from "next/router";
import styles from "./SideNav.module.css";
import React, { useEffect, useState } from "react";
import { ActionIcon, Button, Text, Container, Image, NavLink, useMantineColorScheme, Select, Group } from "@mantine/core";
import {
  IconHistory,
  IconHome,
  IconLogout,
  IconMoonStars,
  IconPhoto,
  IconSettings,
  IconSun,
  IconUser,
  IconUsers,
} from "@tabler/icons-react";
import permissionsManager from "@/lib/permissionsManager";
import Permissions from "@/lib/models/enums/Permissions";
import configManager from "@/lib/configManager";

const items = [
  { icon: IconHome, label: "Home", href: "/" },
  { icon: IconPhoto, label: "Libraries", href: "/libraries" },
  { icon: IconHistory, label: "Activity", href: "/activity" },
  { icon: IconUsers, label: "Users", href: "/users" },
  { icon: IconSettings, label: "Settings", href: "/settings" },
];

export default function SideNav() {
  const router = useRouter();
  const { colorScheme: currentColorScheme, setColorScheme } = useMantineColorScheme();
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [serverOptions, setServerOptions] = useState<{ value: string; label: string }[]>([]);

  const [selectedServer, setSelectedServer] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      setIsAdmin(permissionsManager.hasPermission(Permissions.Administrator));

      if (permissionsManager.hasPermission(Permissions.Administrator)) {
        loadServers();
      }
      // read selected server from localStorage only on client
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("jellystat_serverId");
          if (stored) setSelectedServer(stored);
        } catch {
          /* ignore localStorage errors */
        }
      }
    } catch (err) {
      setIsAdmin(false);
    }
  }, []);

  async function loadServers() {
    try {
      const list = await configManager.getConfig();
      const opts = list.map((s: any) => ({ value: s.id, label: `${s.type} - ${s.name}` }));
      setServerOptions(opts);
    } catch (err: any) {
      console.error("Failed to load server options", err);
    }
  }

  function toggleColorScheme() {
    setColorScheme(currentColorScheme === "dark" ? "light" : "dark");
  }

  return (
    <Container className={styles.container}>
      <Container p={0}>
        <Container className={styles.brandContainer}>
          <Image radius="md" h={40} w={40} src="/icon-b-192.png" />
          <div className={styles.brand}>Jellystat</div>
        </Container>
        <Container p={0}>
          {items.map((it) => {
            if (!isAdmin && it.href === "/settings") return null; // Hide settings from non-admins
            const paths = router.pathname.split("/");
            const path = paths.length > 1 ? `/${paths[1]}` : router.pathname; // Get the first segment of the path
            const active = path.toLocaleLowerCase() === it.href.toLocaleLowerCase();
            return <NavLink href={it.href} active={active} key={it.label} label={it.label} leftSection={<it.icon size={25} />} />;
          })}

          <NavLink
            key="logout"
            label="Logout"
            href="#"
            leftSection={<IconLogout size={25} />}
            onClick={() => {
              try {
                localStorage.removeItem("jellystat_token");
                localStorage.removeItem("jellystat_refreshToken");
                localStorage.removeItem("jellystat_serverId");
                localStorage.removeItem("jellystat_config");
                window.location.href = "/login";
              } catch {
                console.warn("Failed to clear localStorage during logout, but proceeding with navigation.");
              }
            }}
          />
        </Container>
      </Container>
      <Group style={{ paddingInline: 4 }}>
        {isAdmin && (
          <Select
            placeholder={serverOptions.length ? "Select server" : "No servers found"}
            data={serverOptions}
            value={selectedServer}
            onChange={(v) => {
              try {
                if (v) {
                  localStorage.setItem("jellystat_serverId", v);
                  setSelectedServer(v);
                  router.push("/"); // Force reload to apply new server context
                }
              } catch {
                console.warn("Failed to store selected server in localStorage");
              }
            }}
            // searchable
            mt="sm"
          />
        )}
        <Button
          className={styles.footerButton}
          onClick={toggleColorScheme}
          leftSection={mounted ? currentColorScheme === "dark" ? <IconSun size={18} /> : <IconMoonStars size={18} /> : null}
          w={"100%"}
        >
          {mounted
            ? currentColorScheme === "dark"
              ? "Light Mode"
              : currentColorScheme === "light"
                ? "Dark Mode"
                : "Auto Mode"
            : null}
        </Button>
      </Group>
    </Container>
  );
}
