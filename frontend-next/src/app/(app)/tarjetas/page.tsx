import Link from "next/link";
import { CreditCardIcon, TrendingDownIcon, TrendingUpIcon, WalletIcon, ClockIcon, BanknoteIcon } from "@/components/icons";
import { getTarjetasConDeuda } from "@/lib/queries/tarjetas";
import { createClient } from "@/lib/supabase/server";
import { formatoColones, formatoDolares } from "@/lib/currency";
import NuevaTarjetaButton from "./_components/nueva-tarjeta-button";
import TarjetaCard from "./_components/tarjeta-card";
import NuevoBancoButton from "../_components/nuevo-banco-button";
import styles from "./tarjetas.module.scss";

// Auth-scoped Supabase reads (RLS) + live tipo de cambio; must never be cached
// (Gothic #11).
export const dynamic = "force-dynamic";

function calcularDiasHasta(diaObjetivo: number): number {
  const hoy = new Date().getDate();
  return diaObjetivo >= hoy ? diaObjetivo - hoy : diaObjetivo + 31 - hoy;
}

export default async function TarjetasPage() {
  const supabase = await createClient();
  const [{ tarjetas, tipoCambio }, { data: bancos }] = await Promise.all([
    getTarjetasConDeuda(),
    supabase.from("bancos").select("id, nombre").order("nombre"),
  ]);

  // === Métricas únicas de tarjetas (NO repetir dashboard) ===
  const activas = tarjetas.filter((t) => t.es_activa).length;

  // Límite total vs usado (%)
  const limiteTotalUsd = tarjetas.reduce((s, t) => s + (t.limite_credito ?? 0), 0);
  const deudaTotalUsdCombinada = tarjetas.reduce(
    (s, t) => s + t.total_adeudado_usd + (t.total_adeudado_colones > 0 && tipoCambio.compra ? t.total_adeudado_colones / tipoCambio.compra : 0),
    0,
  );
  const usoPorcentaje = limiteTotalUsd > 0 ? Math.round((deudaTotalUsdCombinada / limiteTotalUsd) * 100) : 0;

  // Deuda por moneda (desglose, NO el total que ya está en dashboard)
  const deudaUsdSolo = tarjetas.reduce((s, t) => s + t.total_adeudado_usd, 0);
  const deudaCrcSolo = tarjetas.reduce((s, t) => s + t.total_adeudado_colones, 0);

  // Próximo corte/pago más cercano
  const hoy = new Date().getDate();
  const fechasProximas: Array<{ nombre: string; tipo: string; dias: number }> = [];
  for (const t of tarjetas) {
    if (t.dia_corte) fechasProximas.push({ nombre: t.nombre, tipo: "corte", dias: calcularDiasHasta(t.dia_corte) });
    if (t.dia_pago) fechasProximas.push({ nombre: t.nombre, tipo: "pago", dias: calcularDiasHasta(t.dia_pago) });
  }
  fechasProximas.sort((a, b) => a.dias - b.dias);
  const proximaFecha = fechasProximas[0] ?? null;

  return (
    <div className={styles["tarjetas-page"]}>
      <div className={styles["tarjetas-page__header"]}>
        <div>
          <h1>Mis tarjetas</h1>
          <p>Administra todas tus tarjetas de crédito y sus fechas.</p>
        </div>
        <div className={styles["tarjetas-page__header-actions"]}>
          <NuevoBancoButton
            className={styles["tarjetas-page__nueva"]}
            icon={<BanknoteIcon size={16} />}
          />
          <NuevaTarjetaButton
            bancos={(bancos ?? []) as { id: string; nombre: string }[]}
            tipoCambioVenta={tipoCambio.venta ?? undefined}
            className={styles["tarjetas-page__nueva"]}
            icon={<CreditCardIcon size={16} />}
          />
        </div>
      </div>

      {tarjetas.length > 0 && (
        <>
          {/* Bento metrics — ÚNICOS de tarjetas */}
          <div className={styles["tarjetas-bento-metrics"]}>
            {/* Hero: % uso de límite */}
            <div className={styles["tarjetas-bento-metric--hero"]}>
              <div className={styles["tarjetas-bento-metric__header"]}>
                <WalletIcon size={16} />
                <span className={styles["tarjetas-bento-metric__label"]}>Uso de límite</span>
              </div>
              <div className={styles["tarjetas-bento-metric__amounts"]}>
                <span className={styles["tarjetas-bento-metric__primary"]}>
                  {usoPorcentaje}%
                </span>
              </div>
              <div className={styles["tarjetas-bento-metric__sub"]}>
                ₡{formatoColones(tipoCambio.venta ? deudaTotalUsdCombinada * tipoCambio.venta : 0)} / ₡{formatoColones(tipoCambio.venta ? limiteTotalUsd * tipoCambio.venta : 0)}
              </div>
              {/* Barra visual */}
              <div className={styles["tarjetas-bento-metric__bar"]}>
                <div
                  className={styles["tarjetas-bento-metric__bar-fill"]}
                  style={{ width: `${Math.min(usoPorcentaje, 100)}%` }}
                />
              </div>
            </div>

            <div className={styles["tarjetas-bento-metric--side"]}>
              {/* Deuda por moneda */}
              <div className={styles["tarjetas-bento-metric__item"]}>
                <div className={styles["tarjetas-bento-metric__header"]}>
                  <TrendingDownIcon size={14} />
                  <span className={styles["tarjetas-bento-metric__label"]}>Deuda por moneda</span>
                </div>
                <div className={styles["tarjetas-bento-metric__split"]}>
                  <div className={styles["tarjetas-bento-metric__split-item"]}>
                    <span className={styles["tarjetas-bento-metric__split-label"]}>₡ Colones</span>
                    <span className={styles["tarjetas-bento-metric__split-value"]}>
                      {formatoColones(deudaCrcSolo)}
                    </span>
                  </div>
                  <div className={styles["tarjetas-bento-metric__split-item"]}>
                    <span className={styles["tarjetas-bento-metric__split-label"]}>$ Dólares</span>
                    <span className={styles["tarjetas-bento-metric__split-value"]}>
                      {formatoDolares(deudaUsdSolo)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Próximo corte/pago */}
              <div className={styles["tarjetas-bento-metric__item"]}>
                <div className={styles["tarjetas-bento-metric__header"]}>
                  <ClockIcon size={14} />
                  <span className={styles["tarjetas-bento-metric__label"]}>Próxima fecha</span>
                </div>
                {proximaFecha ? (
                  <>
                    <div className={styles["tarjetas-bento-metric__value"]}>
                      {proximaFecha.tipo === "corte" ? "Corte" : "Pago"}
                    </div>
                    <div className={styles["tarjetas-bento-metric__sub"]}>
                      {proximaFecha.nombre} · {proximaFecha.dias === 0 ? "Hoy" : `En ${proximaFecha.dias} día${proximaFecha.dias !== 1 ? "s" : ""}`}
                    </div>
                  </>
                ) : (
                  <div className={styles["tarjetas-bento-metric__sub"]}>
                    Sin fechas configuradas
                  </div>
                )}
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
              <NuevaTarjetaButton
                bancos={(bancos ?? []) as { id: string; nombre: string }[]}
                tipoCambioVenta={tipoCambio.venta ?? undefined}
                className={styles["tarjetas-page__nueva"]}
                label="Registrar tarjeta"
              />
            </div>
            <div className={styles["tarjetas-page__empty-preview"]}>
              <div className={styles["tarjetas-page__empty-preview-item"]}>
                <WalletIcon size={16} />
                <span>% Uso límite</span>
              </div>
              <div className={styles["tarjetas-page__empty-preview-item"]}>
                <TrendingDownIcon size={16} />
                <span>Deuda por moneda</span>
              </div>
              <div className={styles["tarjetas-page__empty-preview-item"]}>
                <ClockIcon size={16} />
                <span>Próxima fecha</span>
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
