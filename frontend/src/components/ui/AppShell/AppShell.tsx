import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  CreditCardIcon,
  HomeIcon,
  UserIcon,
  ScanBarcodeIcon,
  BellIcon,
} from "../../icons";
import { useAuth } from "../../../hooks/useAuth";
import { auth } from "../../../services/auth";
import "./AppShell.scss";

interface AppShellProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: CreditCardIcon },
  { to: "/dashboard/tarjetas", label: "Tarjetas", icon: HomeIcon },
  { to: "/dashboard/facturas", label: "Facturas", icon: ScanBarcodeIcon },
  { to: "/dashboard/alertas", label: "Alertas", icon: BellIcon },
];

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const nombre = user?.nombre ?? "Usuario";
  const inicial = nombre[0]?.toUpperCase() ?? "U";

  const isActive = (path: string) =>
    location.pathname === path ? "sidebar-link active" : "sidebar-link";

  const handleLogout = () => {
    setDropdownOpen(false);
    auth.clear();
    navigate("/", { replace: true });
  };

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="topbar-left">
          <Link to="/dashboard" className="topbar-brand">
            <img src="/logo.svg" alt="FlowBank" className="topbar-logo" />
            <span className="topbar-title">FlowBank</span>
          </Link>
        </div>
        <div className="topbar-right">
          <div className="topbar-user-dropdown">
            <button
              type="button"
              className="topbar-user"
              onClick={() => setDropdownOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={dropdownOpen}
            >
              <span className="topbar-avatar">{inicial}</span>
              <span className="topbar-name">{nombre}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {dropdownOpen && (
              <div className="topbar-dropdown" role="menu">
                <Link to="/dashboard/perfil" className="dropdown-item" role="menuitem" onClick={() => setDropdownOpen(false)}>
                  <UserIcon size={14} />
                  Mi perfil
                </Link>
                <div className="dropdown-divider" />
                <button type="button" className="dropdown-item dropdown-item--danger" role="menuitem" onClick={handleLogout}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Cerrar sesion
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="app-body">
        <aside className="app-sidebar">
          <nav className="sidebar-nav">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.to} to={item.to} className={isActive(item.to)}>
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="sidebar-spacer" />
          <Link to="/" className="sidebar-link sidebar-link--home">
            <HomeIcon size={18} />
            Volver al inicio
          </Link>
        </aside>

        <main className="app-content">{children}</main>
      </div>

      <nav className="bottom-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={"bottom-nav-link" + (location.pathname === item.to ? " active" : "")}
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

