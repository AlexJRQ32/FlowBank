import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getTarjetasConDeuda } from "@/lib/queries/tarjetas";
import { formatoColones, formatoDolares } from "@/lib/currency";
import {
  BellIcon,
  CreditCardIcon,
  ScanBarcodeIcon,
  ArrowRightIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  FileTextIcon,
  BanknoteIcon,
} from "@/components/icons";
import styles from "./dashboard.module.scss";

// Auth-scoped Supabase reads (RLS); must never be cached (Gothic #11).
export const dynamic = "force-dynamic";

const ACTIONS = [
  {
    to: "/tarjetas",
    icon: CreditCardIcon,
    title: "Registrar tarjeta",
    desc: "Agrega una nueva tarjeta con sus fechas de corte y pago.",
  },
  {
    to: "/facturas/subir",
    icon: ScanBarcodeIcon,
    title: "Subir factura",
    desc: "Sube una factura y extrae sus datos automáticamente.",
  },
  {
    to: "/alertas",
    icon: BellIcon,
    title: "Ver alertas",
    desc: "Revisa las próximas fechas de corte y pago.",
  },
] as const;

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profile, { tarjetas, tipoCambio }, facturasResult] = await Promise.all([
    user
      ? supabase.from("profiles").select("nombre").eq("id", user.id).single()
      : Promise.resolve({ data: null }),
    getTarjetasConDeuda(),
    supabase.from("facturas").select("id", { count: "exact", head: true }),
  ]);

  const nombreUsuario = profile.data?.nombre ?? "Usuario";

  // Métricas reales calculadas desde la DB
  const tarjetasActivas = tarjetas.filter((t) => t.es_activa);
  const deudaTotalUsd = tarjetas.reduce((sum, t) => sum + t.total_adeudado_usd, 0);
  const deudaTotalColones = tarjetas.reduce((sum, t) => sum + t.total_adeudado_colones, 0);
  const disponibleTotalUsd = tarjetas.reduce(
    (sum, t) => sum + (t.limite_disponible_usd ?? 0),
    0,
  );
  const disponibleTotalColones = tarjetas.reduce(
    (sum, t) => sum + (t.limite_disponible_colones ?? 0),
    0,
  );
  const totalFacturas = facturasResult.count ?? 0;
  const totalAlertas = tarjetasActivas.filter((t) => (t.dia_pago ?? 0) > 0).length;

  const hayTarjetas = tarjetas.length > 0;

  return (
    <div className={styles["dashboard-page"]}>
      <section className={styles["dashboard-header"]}>
        <h1 className={styles["dashboard-header__title"]}>
          Bienvenido,{" "}
          <span className={styles["dashboard-header__name"]}>{nombreUsuario}</span>
        </h1>
        <p className={styles["dashboard-header__subtitle"]}>
          Resumen de tus finanzas al{" "}
          {new Date().toLocaleDateString("es-CR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </section>

      {hayTarjetas ? (
        <>
          {/* Bento grid: jerarquía asimétrica con datos reales */}
          <div className={styles["bento-grid"]}>
            {/* Fila principal: deuda total + disponible */}
            <div className={styles["bento-row-main"]}>
              {/* Deuda total — métrica principal */}
              <div className={styles["bento-main"]}>
                <div className={styles["bento-main__header"]}>
                  <TrendingDownIcon size={18} />
                  <span className={styles["bento-main__label"]}>Deuda total</span>
                </div>
                <div className={styles["bento-main__amounts"]}>
                  <div className={styles["bento-main__primary"]}>
                    <span className={styles["bento-main__currency"]}>₡</span>
                    {formatoColones(deudaTotalColones)}
                  </div>
                  <div className={styles["bento-main__secondary"]}>
                    ${formatoDolares(deudaTotalUsd)}
                  </div>
                </div>
                {tipoCambio.venta && (
                  <div className={styles["bento-main__rate"]}>
                    Tipo de cambio: ₡{tipoCambio.venta.toFixed(2)} / $
                    {tipoCambio.compra?.toFixed(2)}
                    <span className={styles["bento-main__source"]}>
                      {" "}
                      — {tipoCambio.fuente}
                    </span>
                  </div>
                )}
              </div>

              {/* Límite disponible */}
              <div className={styles["bento-secondary"]}>
                <div className={styles["bento-secondary__header"]}>
                  <TrendingUpIcon size={16} />
                  <span className={styles["bento-secondary__label"]}>Disponible</span>
                </div>
                <div className={styles["bento-secondary__amount"]}>
                  <span className={styles["bento-secondary__currency"]}>₡</span>
                  {formatoColones(disponibleTotalColones)}
                </div>
                <div className={styles["bento-secondary__sub"]}>
                  ${formatoDolares(disponibleTotalUsd)}
                </div>
              </div>
            </div>

            {/* Fila secundaria: 3 métricas de conteo */}
            <div className={styles["bento-row-tertiary"]}>
              <div className={styles["bento-tertiary"]}>
                <CreditCardIcon size={16} />
                <div className={styles["bento-tertiary__number"]}>
                  {tarjetasActivas.length}
                </div>
                <div className={styles["bento-tertiary__label"]}>
                  Tarjeta{tarjetasActivas.length !== 1 && "s"} activa
                  {tarjetasActivas.length !== 1 && "s"}
                </div>
              </div>

              <div className={styles["bento-tertiary"]}>
                <FileTextIcon size={16} />
                <div className={styles["bento-tertiary__number"]}>{totalFacturas}</div>
                <div className={styles["bento-tertiary__label"]}>
                  Factura{totalFacturas !== 1 && "s"}
                </div>
              </div>

              <div className={styles["bento-tertiary"]}>
                <BanknoteIcon size={16} />
                <div className={styles["bento-tertiary__number"]}>{totalAlertas}</div>
                <div className={styles["bento-tertiary__label"]}>
                  Alerta{totalAlertas !== 1 && "s"} de pago
                </div>
              </div>
            </div>
          </div>

          {/* Acciones rápidas */}
          <section className={styles["dashboard-actions-section"]}>
            <h2 className={styles["dashboard-actions-title"]}>Acciones rápidas</h2>
            <div className={styles["dashboard-actions"]}>
              {ACTIONS.map((a) => (
                <Link key={a.to} href={a.to} className={styles["action-card"]}>
                  <a.icon size={18} />
                  <div className={styles["action-card__text"]}>
                    <div className={styles["action-card__title"]}>{a.title}</div>
                    <div className={styles["action-card__desc"]}>{a.desc}</div>
                  </div>
                  <ArrowRightIcon
                    size={14}
                    className={styles["action-card__arrow"]}
                  />
                </Link>
              ))}
            </div>
          </section>
        </>
      ) : (
        /* Estado vacío: sin tarjetas registradas */
        <div className={styles["dashboard-empty"]}>
          <CreditCardIcon size={40} />
          <h2>Sin tarjetas registradas</h2>
          <p>
            Registra tu primera tarjeta para ver el resumen de tus finanzas y las
            métricas de deuda y disponibilidad.
          </p>
          <Link href="/tarjetas/nueva" className={styles["dashboard-empty__cta"]}>
            Registrar tarjeta
          </Link>
        </div>
      )}
    </div>
  );
}
