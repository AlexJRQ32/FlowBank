import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  BellIcon,
  ClockIcon,
  CreditCardIcon,
  ScanBarcodeIcon,
  WalletIcon,
} from "@/components/icons";
import styles from "./dashboard.module.scss";

// Auth-scoped Supabase reads (RLS); must never be cached (Gothic #11).
export const dynamic = "force-dynamic";

const ACTIONS = [
  {
    to: "/tarjetas",
    icon: CreditCardIcon,
    color: "blue",
    title: "Registrar tarjeta",
    desc: "Agrega una nueva tarjeta con sus fechas de corte y pago.",
  },
  {
    to: "/bancos",
    icon: WalletIcon,
    color: "orange",
    title: "Registrar banco",
    desc: "Agrega un nuevo banco al catalogo.",
  },
  {
    to: "/facturas",
    icon: ScanBarcodeIcon,
    color: "green",
    title: "Subir factura",
    desc: "Fotografia una factura y extrae sus datos automaticamente.",
  },
  {
    to: "/alertas",
    icon: BellIcon,
    color: "purple",
    title: "Mis alertas",
    desc: "Revisa las proximas fechas de corte y pago.",
  },
] as const;

const STAT_CONFIG = [
  { icon: CreditCardIcon, color: "blue", label: "Tarjetas" },
  { icon: WalletIcon, color: "purple", label: "Bancos" },
  { icon: ScanBarcodeIcon, color: "green", label: "Facturas" },
  { icon: BellIcon, color: "orange", label: "Alertas" },
] as const;

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profile, tarjetas, bancos, facturas] = await Promise.all([
    user
      ? supabase.from("profiles").select("nombre").eq("id", user.id).single()
      : Promise.resolve({ data: null }),
    supabase.from("tarjetas").select("dia_pago"),
    supabase.from("bancos").select("id", { count: "exact", head: true }),
    supabase.from("facturas").select("id", { count: "exact", head: true }),
  ]);

  const stats = {
    tarjetas: tarjetas.data?.length ?? 0,
    bancos: bancos.count ?? 0,
    facturas: facturas.count ?? 0,
    // Legacy parity: alerts = cards with a payment day configured.
    alertas: (tarjetas.data ?? []).filter((t) => (t.dia_pago ?? 0) > 0).length,
  };

  const nombreUsuario = profile.data?.nombre ?? "Usuario";

  return (
    <div className={styles["dashboard-page"]}>
      {/* OpenPaw header banner: meta row (role badge) above the title */}
      <section className={styles["dashboard-header"]}>
        <div className={styles["dashboard-header__info"]}>
          <div className={styles["dashboard-header__meta"]}>
            <span className={styles["dashboard-role-badge"]}>Usuario</span>
          </div>
          <h1 className={styles["dashboard-header__title"]}>
            Bienvenido, <span className={styles["dashboard-header__name"]}>{nombreUsuario}</span>
          </h1>
        </div>
      </section>

      <div className={styles["stat-cards"]}>
        {STAT_CONFIG.map((card) => (
          <div key={card.label} className={styles["stat-card"]}>
            <div className={`${styles["stat-card__icon"]} ${styles[`stat-card__icon--${card.color}`]}`}>
              <card.icon size={20} />
            </div>
            <div>
              <div className={styles["stat-card__number"]}>
                {stats[card.label.toLowerCase() as keyof typeof stats] ?? 0}
              </div>
              <div className={styles["stat-card__label"]}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      <section className={styles["dashboard-section-header"]}>
        <div className={styles["dashboard-section-icon"]}>
          <ClockIcon size={16} />
        </div>
        <div className={styles["dashboard-section-text"]}>
          <h2 className={styles["dashboard-section-title"]}>Acciones rapidas</h2>
          <p className={styles["dashboard-section-subtitle"]}>
            Atajos para registrar tarjetas, bancos y facturas
          </p>
        </div>
      </section>
      <div className={styles["dashboard-actions"]}>
        {ACTIONS.map((a) => (
          <Link key={a.to} href={a.to} className={styles["action-card"]}>
            <div className={`${styles["action-icon"]} ${styles[`action-icon--${a.color}`]}`}>
              <a.icon size={22} />
            </div>
            <div className={styles["action-title"]}>{a.title}</div>
            <div className={styles["action-desc"]}>{a.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
