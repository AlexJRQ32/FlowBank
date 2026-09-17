import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getTarjetasConDeuda } from "@/lib/queries/tarjetas";
import NuevaTarjetaButton from "../tarjetas/_components/nueva-tarjeta-button";
import { formatoColones, formatoDolares, simboloMoneda } from "@/lib/currency";
import {
  CreditCardIcon,
  ScanBarcodeIcon,
  ArrowRightIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  FileTextIcon,
  BanknoteIcon,
  ClockIcon,
  BellIcon,
} from "@/components/icons";
import styles from "./dashboard.module.scss";

// Auth-scoped Supabase reads (RLS); must never be cached (Gothic #11).
export const dynamic = "force-dynamic";

interface FacturaReciente {
  id: string;
  monto_total: number | null;
  moneda: string;
  fecha_compra: string | null;
  comercio: string | null;
  tarjetas: { nombre: string | null } | null;
}

interface FechaProxima {
  tarjetaId: string;
  nombre: string;
  banco: string;
  tipo: "corte" | "pago";
  dia: number;
}

function calcularProximas(
  tarjetas: Array<{
    id: string;
    nombre: string;
    dia_corte: number | null;
    dia_pago: number | null;
    bancos: Array<{ nombre: string }> | { nombre: string } | null;
  }>,
): FechaProxima[] {
  const hoy = new Date().getDate();
  const result: FechaProxima[] = [];
  for (const t of tarjetas) {
    const bancoJoin = Array.isArray(t.bancos) ? (t.bancos[0] ?? null) : (t.bancos ?? null);
    const nombreBanco = bancoJoin?.nombre ?? "Banco";
    if (t.dia_corte)
      result.push({ tarjetaId: t.id, nombre: t.nombre, banco: nombreBanco, tipo: "corte", dia: t.dia_corte });
    if (t.dia_pago)
      result.push({ tarjetaId: t.id, nombre: t.nombre, banco: nombreBanco, tipo: "pago", dia: t.dia_pago });
  }
  const dist = (dia: number) => (dia >= hoy ? dia - hoy : dia + 31 - hoy);
  return result.sort((a, b) => dist(a.dia) - dist(b.dia));
}

function formatFecha(fecha: string | null): string {
  if (!fecha) return "Sin fecha";
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-CR", {
    day: "numeric",
    month: "short",
  });
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profile, { tarjetas, tipoCambio }, facturasResult, facturasRecientes, alertasData, bancosData] =
    await Promise.all([
      user
        ? supabase.from("profiles").select("nombre").eq("id", user.id).single()
        : Promise.resolve({ data: null }),
      getTarjetasConDeuda(),
      supabase.from("facturas").select("id", { count: "exact", head: true }),
      supabase
        .from("facturas")
        .select("id, monto_total, moneda, fecha_compra, comercio, tarjetas(nombre)")
        .order("fecha_compra", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("tarjetas")
        .select("id, nombre, dia_corte, dia_pago, bancos(nombre)")
        .order("created_at", { ascending: false }),
      supabase.from("bancos").select("id, nombre").order("nombre"),
    ]);

  const nombreUsuario = profile.data?.nombre ?? "Usuario";

  // Métricas reales
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
  const proximas = calcularProximas(alertasData.data ?? []);
  const totalAlertas = proximas.length;

  const hayTarjetas = tarjetas.length > 0;
  // Cast: Supabase infers the FK as an array; at runtime it's a single object.
  const facturasLista = (facturasRecientes.data ?? []) as unknown as FacturaReciente[];

  // Calcular total de límite de crédito
  const limiteTotalUsd = tarjetas.reduce(
    (sum, t) => sum + (t.limite_credito ?? 0),
    0,
  );
  const limiteTotalColones = tarjetas.reduce(
    (sum, t) => sum + (t.limite_credito_colones ?? 0),
    0,
  );

  return (
    <div className={styles["dashboard-page"]}>
      {/* Header */}
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
          {/* === Fila hero: deuda total + disponible === */}
          <div className={styles["bento-row-hero"]}>
            <div className={styles["bento-hero-main"]}>
              <div className={styles["bento-hero-main__header"]}>
                <TrendingDownIcon size={18} />
                <span className={styles["bento-hero-main__label"]}>Deuda total</span>
              </div>
              <div className={styles["bento-hero-main__amounts"]}>
                <div className={styles["bento-hero-main__primary"]}>
                  <span className={styles["bento-hero-main__currency"]}>₡</span>
                  {formatoColones(deudaTotalColones)}
                </div>
                <div className={styles["bento-hero-main__secondary"]}>
                  ${formatoDolares(deudaTotalUsd)}
                </div>
              </div>
              {tipoCambio.venta && (
                <div className={styles["bento-hero-main__rate"]}>
                  Tipo de cambio: ₡{tipoCambio.venta.toFixed(2)} / $
                  {tipoCambio.compra?.toFixed(2)}
                  <span className={styles["bento-hero-main__source"]}>
                    {" "}
                   : {tipoCambio.fuente}
                  </span>
                </div>
              )}
            </div>

            <div className={styles["bento-hero-side"]}>
              <div className={styles["bento-hero-side__item"]}>
                <div className={styles["bento-hero-side__header"]}>
                  <TrendingUpIcon size={16} />
                  <span className={styles["bento-hero-side__label"]}>Disponible</span>
                </div>
                <div className={styles["bento-hero-side__amount"]}>
                  <span className={styles["bento-hero-side__currency"]}>₡</span>
                  {formatoColones(disponibleTotalColones)}
                </div>
                <div className={styles["bento-hero-side__sub"]}>
                  ${formatoDolares(disponibleTotalUsd)}
                </div>
              </div>
              <div className={styles["bento-hero-side__item"]}>
                <div className={styles["bento-hero-side__header"]}>
                  <CreditCardIcon size={16} />
                  <span className={styles["bento-hero-side__label"]}>Límite total</span>
                </div>
                <div className={styles["bento-hero-side__amount"]}>
                  <span className={styles["bento-hero-side__currency"]}>₡</span>
                  {formatoColones(limiteTotalColones)}
                </div>
                <div className={styles["bento-hero-side__sub"]}>
                  ${formatoDolares(limiteTotalUsd)}
                </div>
              </div>
            </div>
          </div>

          {/* === Fila métricas de conteo === */}
          <div className={styles["bento-row-metrics"]}>
            <Link href="/tarjetas" className={styles["bento-metric"]}>
              <CreditCardIcon size={16} />
              <div className={styles["bento-metric__number"]}>
                {tarjetasActivas.length}
              </div>
              <div className={styles["bento-metric__label"]}>
                Tarjeta{tarjetasActivas.length !== 1 && "s"} activa
                {tarjetasActivas.length !== 1 && "s"}
              </div>
            </Link>

            <Link href="/facturas" className={styles["bento-metric"]}>
              <FileTextIcon size={16} />
              <div className={styles["bento-metric__number"]}>{totalFacturas}</div>
              <div className={styles["bento-metric__label"]}>
                Factura{totalFacturas !== 1 && "s"}
              </div>
            </Link>

            <Link href="/alertas" className={styles["bento-metric"]}>
              <BellIcon size={16} />
              <div className={styles["bento-metric__number"]}>{totalAlertas}</div>
              <div className={styles["bento-metric__label"]}>
                Alerta{totalAlertas !== 1 && "s"}
              </div>
            </Link>

            <div className={styles["bento-metric"]}>
              <BanknoteIcon size={16} />
              <div className={styles["bento-metric__number"]}>
                {tarjetas.length}
              </div>
              <div className={styles["bento-metric__label"]}>
                Total tarjetas
              </div>
            </div>
          </div>

          {/* === Fila contenido: facturas recientes + próximas alertas === */}
          <div className={styles["bento-row-content"]}>
            {/* Últimas facturas */}
            <section className={styles["panel"]}>
              <div className={styles["panel__header"]}>
                <h2 className={styles["panel__title"]}>Últimas facturas</h2>
                <Link href="/facturas" className={styles["panel__link"]}>
                  Ver todas <ArrowRightIcon size={12} />
                </Link>
              </div>
              {facturasLista.length > 0 ? (
                <ul className={styles["panel__list"]}>
                  {facturasLista.map((f) => (
                    <li key={f.id} className={styles["panel__item"]}>
                      <div className={styles["panel__item-icon"]}>
                        <ScanBarcodeIcon size={16} />
                      </div>
                      <div className={styles["panel__item-info"]}>
                        <span className={styles["panel__item-title"]}>
                          {f.comercio || "Comercio"}
                        </span>
                        <span className={styles["panel__item-sub"]}>
                          {formatFecha(f.fecha_compra)}
                          {f.tarjetas?.nombre && ` · ${f.tarjetas.nombre}`}
                        </span>
                      </div>
                      <span className={styles["panel__item-amount"]}>
                        {simboloMoneda(f.moneda)}
                        {f.moneda === "USD"
                          ? formatoDolares(f.monto_total)
                          : formatoColones(f.monto_total)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className={styles["panel__empty"]}>
                  <FileTextIcon size={32} />
                  <p>Sin facturas registradas</p>
                  <Link href="/facturas/subir" className={styles["panel__empty-cta"]}>
                    Subir factura
                  </Link>
                </div>
              )}
            </section>

            {/* Próximas alertas */}
            <section className={styles["panel"]}>
              <div className={styles["panel__header"]}>
                <h2 className={styles["panel__title"]}>Próximas fechas</h2>
                <Link href="/alertas" className={styles["panel__link"]}>
                  Ver todas <ArrowRightIcon size={12} />
                </Link>
              </div>
              {proximas.length > 0 ? (
                <ul className={styles["panel__list"]}>
                  {proximas.slice(0, 5).map((f) => (
                    <li
                      key={`${f.tarjetaId}-${f.tipo}`}
                      className={styles["panel__item"]}
                    >
                      <div
                        className={`${styles["panel__item-badge"]} ${
                          styles[`panel__item-badge--${f.tipo}`]
                        }`}
                      >
                        {f.tipo === "corte" ? (
                          <ClockIcon size={14} />
                        ) : (
                          <BanknoteIcon size={14} />
                        )}
                      </div>
                      <div className={styles["panel__item-info"]}>
                        <span className={styles["panel__item-title"]}>
                          {f.tipo === "corte" ? "Corte" : "Pago"}: {f.nombre}
                        </span>
                        <span className={styles["panel__item-sub"]}>{f.banco}</span>
                      </div>
                      <span
                        className={`${styles["panel__item-day"]} ${
                          styles[`panel__item-day--${f.tipo}`]
                        }`}
                      >
                        Día {f.dia}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className={styles["panel__empty"]}>
                  <BellIcon size={32} />
                  <p>Sin fechas configuradas</p>
                  <Link href="/tarjetas" className={styles["panel__empty-cta"]}>
                    Configurar tarjetas
                  </Link>
                </div>
              )}
            </section>
          </div>

          {/* === Fila resumen por tarjeta === */}
          <section className={styles["panel panel--full"]}>
            <div className={styles["panel__header"]}>
              <h2 className={styles["panel__title"]}>Resumen por tarjeta</h2>
              <Link href="/tarjetas" className={styles["panel__link"]}>
                Administrar <ArrowRightIcon size={12} />
              </Link>
            </div>
            <div className={styles["card-summary-grid"]}>
              {tarjetas.map((t) => (
                <Link
                  key={t.id}
                  href={`/tarjetas/${t.id}/editar`}
                  className={styles["card-summary"]}
                >
                  <div className={styles["card-summary__header"]}>
                    <CreditCardIcon size={16} />
                    <div className={styles["card-summary__name-group"]}>
                      <span className={styles["card-summary__name"]}>{t.nombre}</span>
                      <span className={styles["card-summary__bank"]}>
                        {t.bancos?.nombre ?? "Banco"} ·••• {t.ultimos_cuatro_digitos}
                      </span>
                    </div>
                    {!t.es_activa && (
                      <span className={styles["card-summary__inactive"]}>Inactiva</span>
                    )}
                  </div>
                  <div className={styles["card-summary__row"]}>
                    <span className={styles["card-summary__label"]}>Debes</span>
                    <span className={styles["card-summary__value"]}>
                      ₡{formatoColones(t.total_adeudado_colones)} · $
                      {formatoDolares(t.total_adeudado_usd)}
                    </span>
                  </div>
                  <div className={styles["card-summary__row"]}>
                    <span className={styles["card-summary__label"]}>Disponible</span>
                    <span className={styles["card-summary__value"]}>
                      ₡{formatoColones(t.limite_disponible_colones)} · $
                      {formatoDolares(t.limite_disponible_usd)}
                    </span>
                  </div>
                  {(t.dia_corte || t.dia_pago) && (
                    <div className={styles["card-summary__dates"]}>
                      {t.dia_corte && <span>Corte: día {t.dia_corte}</span>}
                      {t.dia_pago && <span>Pago: día {t.dia_pago}</span>}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </section>
        </>
      ) : (
        /* Estado vacío estructurado */
        <div className={styles["dashboard-empty"]}>
          <div className={styles["dashboard-empty__grid"]}>
            <div className={styles["dashboard-empty__main"]}>
              <CreditCardIcon size={48} />
              <h2>Sin tarjetas registradas</h2>
              <p>
                Registra tu primera tarjeta para ver el resumen de tus finanzas: deuda
                total, limite disponible, facturas y fechas de pago.
              </p>
              <NuevaTarjetaButton
                bancos={(bancosData.data ?? []) as { id: string; nombre: string }[]}
                tipoCambioVenta={tipoCambio.venta ?? undefined}
                className={styles["dashboard-empty__cta"]}
                label="Registrar tarjeta"
              />
            </div>
            <div className={styles["dashboard-empty__preview"]}>
              <div className={styles["dashboard-empty__preview-item"]}>
                <TrendingDownIcon size={16} />
                <span>Deuda total</span>
              </div>
              <div className={styles["dashboard-empty__preview-item"]}>
                <TrendingUpIcon size={16} />
                <span>Disponible</span>
              </div>
              <div className={styles["dashboard-empty__preview-item"]}>
                <FileTextIcon size={16} />
                <span>Facturas</span>
              </div>
              <div className={styles["dashboard-empty__preview-item"]}>
                <BellIcon size={16} />
                <span>Alertas</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
