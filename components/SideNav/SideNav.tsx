import { useRouter } from "next/router";
import styles from "./SideNav.module.css";
import React from "react";
import { ActionIcon, Button, Text, Container, Image, NavLink, useMantineColorScheme } from "@mantine/core";
import { IconHistory, IconHome, IconLogout, IconMoonStars, IconPhoto, IconSun } from "@tabler/icons-react";

const items = [
  { icon: IconHome, label: "Home", href: "/" },
  { icon: IconPhoto, label: "Libraries", href: "/libraries" },
  { icon: IconHistory, label: "Activity", href: "/activity" },
];

export default function SideNav() {
  const router = useRouter();
  const { colorScheme: currentColorScheme, setColorScheme } = useMantineColorScheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

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
            const paths = router.pathname.split("/");
            const path = paths.length > 1 ? `/${paths[1]}` : router.pathname; // Get the first segment of the path
            const active = path.toLocaleLowerCase() === it.href.toLocaleLowerCase();
            console.log(`Comparing path "${path}" to href "${it.href}" - active: ${active}`);
            return <NavLink href={it.href} active={active} key={it.label} label={it.label} leftSection={<it.icon size={25} />} />;
          })}

          <NavLink
            active={router.pathname === "/login"}
            key="logout"
            label="Logout"
            leftSection={
              <IconLogout
                size={25}
                onClick={() => {
                  try {
                    localStorage.removeItem("jellystat_token");
                    localStorage.removeItem("jellystat_refreshToken");
                    window.location.href = "/login";
                  } catch {
                    console.warn("Failed to clear localStorage during logout, but proceeding with navigation.");
                  }
                }}
              />
            }
          />
        </Container>
      </Container>
      <Button
        className={styles.footerButton}
        onClick={toggleColorScheme}
        leftSection={mounted ? currentColorScheme === "dark" ? <IconSun size={18} /> : <IconMoonStars size={18} /> : null}
      >
        {mounted
          ? currentColorScheme === "dark"
            ? "Light Mode"
            : currentColorScheme === "light"
              ? "Dark Mode"
              : "Auto Mode"
          : null}
      </Button>
    </Container>
  );
}
