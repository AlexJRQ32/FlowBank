"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BellIcon,
  CreditCardIcon,
  HomeIcon,
  ScanBarcodeIcon,
  UserIcon,
} from "@/components/icons";
import { signOutAction } from "@/lib/actions/auth";
import styles from "../shell.module.scss";

const STORAGE_KEY = "sidebar-collapsed";

// Collapsible sidebar (OpenPaw pattern): state persisted in localStorage,
// external store keeps render/snapshot in sync without setState-in-effect.
function useSidebarCollapsed() {
  const subscribe = (cb: () => void) => {
    window.addEventListener("sidebar-collapsed-change", cb);
    return () => window.removeEventListener("sidebar-collapsed-change", cb);
  };
  const collapsed = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(STORAGE_KEY) === "true",
    () => false,
  );
  const toggle = () => {
    localStorage.setItem(STORAGE_KEY, String(!collapsed));
    window.dispatchEvent(new Event("sidebar-collapsed-change"));
  };
  return [collapsed, toggle] as const;
}

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: CreditCardIcon },
  { to: "/tarjetas", label: "Tarjetas", icon: HomeIcon },
  { to: "/facturas", label: "Facturas", icon: ScanBarcodeIcon },
  { to: "/alertas", label: "Alertas", icon: BellIcon },
];

// Panel-left (Lucide outline): rect with a vertical divider on the left.
function PanelLeftIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M9 3v18" />
    </svg>
  );
}

interface AppShellProps {
  children: ReactNode;
  nombre: string;
}

export function AppShell({ children, nombre }: AppShellProps) {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [collapsed, toggleCollapsed] = useSidebarCollapsed();

  const inicial = nombre[0]?.toUpperCase() ?? "U";

  const isActive = (to: string) =>
    pathname === to
      ? `${styles["sidebar-link"]} ${styles.active}`
      : styles["sidebar-link"];

  return (
    <div
      className={`${styles["app-shell"]}${collapsed ? ` ${styles["app-shell--sidebar-collapsed"]}` : ""}`}
    >
      <header className={styles["app-topbar"]}>
        <div className={styles["topbar-left"]}>
          <Link href="/dashboard" className={styles["topbar-brand"]}>
            <img src="/logo.svg" alt="FlowBank" className={styles["topbar-logo"]} />
            <span className={styles["topbar-title"]}>FlowBank</span>
          </Link>
        </div>
        <div className={styles["topbar-right"]}>
          <div className={styles["topbar-user-dropdown"]}>
            <button
              type="button"
              className={styles["topbar-user"]}
              onClick={() => setDropdownOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={dropdownOpen}
            >
              <span className={styles["topbar-avatar"]}>{inicial}</span>
              <span className={styles["topbar-name"]}>{nombre}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {dropdownOpen && (
              <div className={styles["topbar-dropdown"]} role="menu">
                <Link href="/perfil" className={styles["dropdown-item"]} role="menuitem" onClick={() => setDropdownOpen(false)}>
                  <UserIcon size={14} />
                  Mi perfil
                </Link>
                <div className={styles["dropdown-divider"]} />
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className={`${styles["dropdown-item"]} ${styles["dropdown-item--danger"]}`}
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Cerrar sesion
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className={styles["app-body"]}>
        <aside className={styles["app-sidebar"]} aria-label="Dashboard navigation">
          <div className={styles["sidebar-top"]}>
            <button
              type="button"
              className={styles["sidebar-toggle"]}
              onClick={toggleCollapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
            >
              {/* Static icon in both states, no flip (OpenPaw behavior). */}
              <PanelLeftIcon size={20} />
            </button>
          </div>
          <nav className={styles["sidebar-nav"]}>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  href={item.to}
                  className={isActive(item.to)}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={18} />
                  <span className={styles["sidebar-label"]}>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className={styles["sidebar-spacer"]} />
          <Link
            href="/"
            className={`${styles["sidebar-link"]} ${styles["sidebar-link--home"]}`}
            title={collapsed ? "Back to home" : undefined}
          >
            <HomeIcon size={18} />
            <span className={styles["sidebar-label"]}>Volver al inicio</span>
          </Link>
        </aside>

        <main className={styles["app-content"]}>{children}</main>
      </div>

      <nav className={styles["bottom-nav"]}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              href={item.to}
              className={`${styles["bottom-nav-link"]}${pathname === item.to ? ` ${styles.active}` : ""}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default AppShell;
