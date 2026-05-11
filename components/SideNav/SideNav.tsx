import Link from "next/link";
import { useRouter } from "next/router";
import styles from "./SideNav.module.css";
import React from "react";
import { Center, Container, Image, NavLink } from "@mantine/core";
import { IconHistory, IconHome, IconLogout, IconPhoto } from "@tabler/icons-react";

const items = [
  { icon: IconHome, label: "Home", href: "/" },
  { icon: IconPhoto, label: "Libraries", href: "/libraries" },
  { icon: IconHistory, label: "Activity", href: "/activity" },
];

export default function SideNav() {
  const router = useRouter();

  return (
    <Container p={0} className={styles.container}>
      <Center style={{ flexDirection: "row" }}>
        <Image radius="md" h={50} w={50} src="/icon-b-192.png" />
        <div className={styles.brand}>Jellystat</div>
      </Center>
      <>
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
      </>
    </Container>
  );
}
