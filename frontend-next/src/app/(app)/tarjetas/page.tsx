import Link from "next/link";
import { CreditCardIcon, TrendingDownIcon, TrendingUpIcon, WalletIcon } from "@/components/icons";
import { getTarjetasConDeuda } from "@/lib/queries/tarjetas";
import { formatoColones, formatoDolares } from "@/lib/currency";
import TarjetaCard from "./_components/tarjeta-card";
import styles from "./tarjetas.module.scss";

// Auth-scoped Supabase reads (RLS) + live tipo de cambio; must never be cached
// (Gothic #11).
export const dynamic = "force-dynamic";

export default async function TarjetasPage() {
  const { tarjetas, tipoCambio } = await getTarjetasConDeuda();

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
  const totalLimiteUsd = tarjetas.reduce((s, t) => s + (t.limite_credito ?? 0), 0);
  const totalLimiteColones = tarjetas.reduce(
    (s, t) => s + (t.limite_credito_colones ?? 0),
    0,
  );

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
        <>
          {/* Bento metrics */}
          <div className={styles["tarjetas-bento-metrics"]}>
            <div className={styles["tarjetas-bento-metric--hero"]}>
              <div className={styles["tarjetas-bento-metric__header"]}>
                <TrendingDownIcon size={16} />
                <span className={styles["tarjetas-bento-metric__label"]}>Deuda total</span>
              </div>
              <div className={styles["tarjetas-bento-metric__amounts"]}>
                <span className={styles["tarjetas-bento-metric__primary"]}>
                  ₡{formatoColones(totalDeudaColones)}
                </span>
                <span className={styles["tarjetas-bento-metric__secondary"]}>
                  ${formatoDolares(totalDeudaUsd)}
                </span>
              </div>
            </div>

            <div className={styles["tarjetas-bento-metric--side"]}>
              <div className={styles["tarjetas-bento-metric__item"]}>
                <div className={styles["tarjetas-bento-metric__header"]}>
                  <TrendingUpIcon size={14} />
                  <span className={styles["tarjetas-bento-metric__label"]}>Disponible</span>
                </div>
                <div className={styles["tarjetas-bento-metric__value"]}>
                  ₡{formatoColones(totalDisponibleColones)}
                </div>
                <div className={styles["tarjetas-bento-metric__sub"]}>
                  ${formatoDolares(totalDisponibleUsd)}
                </div>
              </div>
              <div className={styles["tarjetas-bento-metric__item"]}>
                <div className={styles["tarjetas-bento-metric__header"]}>
                  <WalletIcon size={14} />
                  <span className={styles["tarjetas-bento-metric__label"]}>Límite</span>
                </div>
                <div className={styles["tarjetas-bento-metric__value"]}>
                  ₡{formatoColones(totalLimiteColones)}
                </div>
                <div className={styles["tarjetas-bento-metric__sub"]}>
                  ${formatoDolares(totalLimiteUsd)}
                </div>
              </div>
            </div>

            <div className={styles["tarjetas-bento-metric--count"]}>
              <div className={styles["tarjetas-bento-metric__header"]}>
                <CreditCardIcon size={14} />
                <span className={styles["tarjetas-bento-metric__label"]}>Registradas</span>
              </div>
              <div className={styles["tarjetas-bento-metric__big-number"]}>
                {activas}<span className={styles["tarjetas-bento-metric__denom"]}> / {tarjetas.length}</span>
              </div>
              <div className={styles["tarjetas-bento-metric__sub"]}>
                activa{tarjetas.length !== 1 && "s"}
              </div>
            </div>
          </div>

          {tipoCambio.venta && (
            <div className={styles["tarjetas-tipo-cambio"]}>
              Tipo de cambio: ₡{tipoCambio.venta.toFixed(2)} / ${tipoCambio.compra?.toFixed(2)}
              <span> — {tipoCambio.fuente}</span>
            </div>
          )}
        </>
      )}

      {!tarjetas?.length ? (
        <div className={styles["tarjetas-page__empty-state"]}>
          <div className={styles["tarjetas-page__empty-grid"]}>
            <div className={styles["tarjetas-page__empty-main"]}>
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
            <div className={styles["tarjetas-page__empty-preview"]}>
              <div className={styles["tarjetas-page__empty-preview-item"]}>
                <TrendingDownIcon size={16} />
                <span>Deuda total</span>
              </div>
              <div className={styles["tarjetas-page__empty-preview-item"]}>
                <TrendingUpIcon size={16} />
                <span>Disponible</span>
              </div>
              <div className={styles["tarjetas-page__empty-preview-item"]}>
                <WalletIcon size={16} />
                <span>Límite</span>
              </div>
              <div className={styles["tarjetas-page__empty-preview-item"]}>
                <CreditCardIcon size={16} />
                <span>Activas</span>
              </div>
            </div>
          </div>
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
