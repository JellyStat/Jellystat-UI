import Link from "next/link";
import { useRouter } from "next/router";
import styles from "./SideNav.module.css";
import React from "react";

const items = [
  { href: "/", label: "Home" },
  { href: "/libraries", label: "Libraries" },
  { href: "/media", label: "Media" },
  { href: "/libraries/overview", label: "Overview" },
  { href: "/login", label: "Login" },
];

export default function SideNav() {
  const router = useRouter();

  return (
    <aside className={styles.container}>
      <div className={styles.brand}>Jellystat</div>
      <nav className={styles.nav} aria-label="Main">
        {items.map((it) => {
          const active = router.pathname === it.href;
          return (
            <Link key={it.href} href={it.href} legacyBehavior>
              <a className={[styles.link, active ? styles.linkActive : ""].join(" ")}>{it.label}</a>
            </Link>
          );
        })}
      </nav>
      <div className={styles.footer}>v1 • client</div>
    </aside>
  );
}
