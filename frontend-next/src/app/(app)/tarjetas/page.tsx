import Link from "next/link";
import { CreditCardIcon, TrendingDownIcon, TrendingUpIcon } from "@/components/icons";
import { getTarjetasConDeuda } from "@/lib/queries/tarjetas";
import { formatoColones, formatoDolares } from "@/lib/currency";
import TarjetaCard from "./_components/tarjeta-card";
import styles from "./tarjetas.module.scss";

// Auth-scoped Supabase reads (RLS) + live tipo de cambio; must never be cached
// (Gothic #11).
export const dynamic = "force-dynamic";

export default async function TarjetasPage() {
  const { tarjetas } = await getTarjetasConDeuda();

  // Métricas reales
  const totalDeudaUsd = tarjetas.reduce((s, t) => s + t.total_adeudado_usd, 0);
  const totalDeudaColones = tarjetas.reduce((s, t) => s + t.total_adeudado_colones, 0);
  const totalDisponibleUsd = tarjetas.reduce(
    (s, t) => s + (t.limite_disponible_usd ?? 0),
    0,
  );
  const totalDisponibleColones = tarjetas.reduce(
    (s, t) => s + (t.limite_disponible_colones ?? 0),
    0,
  );
  const activas = tarjetas.filter((t) => t.es_activa).length;

  return (
    <div className={styles["tarjetas-page"]}>
      <div className={styles["tarjetas-page__header"]}>
        <div>
          <h1>Mis tarjetas</h1>
          <p>Administra todas tus tarjetas de crédito y sus fechas.</p>
        </div>
        <Link href="/tarjetas/nueva" className={styles["tarjetas-page__nueva"]}>
          <CreditCardIcon size={16} />
          Nueva tarjeta
        </Link>
      </div>

      {tarjetas.length > 0 && (
        <div className={styles["tarjetas-metrics"]}>
          <div className={styles["tarjetas-metric"]}>
            <TrendingDownIcon size={14} />
            <div className={styles["tarjetas-metric__data"]}>
              <span className={styles["tarjetas-metric__label"]}>Deuda total</span>
              <span className={styles["tarjetas-metric__value"]}>
                ₡{formatoColones(totalDeudaColones)} · ${formatoDolares(totalDeudaUsd)}
              </span>
            </div>
          </div>
          <div className={styles["tarjetas-metric"]}>
            <TrendingUpIcon size={14} />
            <div className={styles["tarjetas-metric__data"]}>
              <span className={styles["tarjetas-metric__label"]}>Disponible</span>
              <span className={styles["tarjetas-metric__value"]}>
                ₡{formatoColones(totalDisponibleColones)} · ${formatoDolares(totalDisponibleUsd)}
              </span>
            </div>
          </div>
          <div className={styles["tarjetas-metric"]}>
            <CreditCardIcon size={14} />
            <div className={styles["tarjetas-metric__data"]}>
              <span className={styles["tarjetas-metric__label"]}>Registradas</span>
              <span className={styles["tarjetas-metric__value"]}>
                {activas} de {tarjetas.length} activa{tarjetas.length !== 1 && "s"}
              </span>
            </div>
          </div>
        </div>
      )}

      {!tarjetas?.length ? (
        <div className={styles["tarjetas-page__empty-state"]}>
          <CreditCardIcon size={40} />
          <h2>Sin tarjetas todavía</h2>
          <p>
            Registra tu primera tarjeta para empezar a controlar tus fechas de corte
            y pago, y ver el resumen de tu deuda.
          </p>
          <Link href="/tarjetas/nueva" className={styles["tarjetas-page__nueva"]}>
            Registrar tarjeta
          </Link>
        </div>
      ) : (
        <ul className={styles["tarjetas-page__grid"]}>
          {tarjetas.map((tarjeta) => (
            <TarjetaCard key={tarjeta.id} tarjeta={tarjeta} />
          ))}
        </ul>
      )}
    </div>
  );
}
