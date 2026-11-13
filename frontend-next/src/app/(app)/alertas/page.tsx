import Link from "next/link";
import { BellIcon, CreditCardIcon, ClockIcon, BanknoteIcon, TrendingUpIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import styles from "./alertas.module.scss";

// Auth-scoped Supabase reads (RLS); must never be cached (Gothic #11).
export const dynamic = "force-dynamic";

interface FechaProxima {
  tarjetaId: string;
  nombre: string;
  banco: string;
  tipo: "corte" | "pago";
  dia: number;
}

// Ported 1:1 from legacy AlertasPage.calcularProximas: sort both dates of each
// card by distance to today (wrapping at 31 days).
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

function calcularDiasHasta(diaObjetivo: number): number {
  const hoy = new Date().getDate();
  return diaObjetivo >= hoy ? diaObjetivo - hoy : diaObjetivo + 31 - hoy;
}

export default async function AlertasPage() {
  const supabase = await createClient();
  const { data: tarjetas } = await supabase
    .from("tarjetas")
    .select("id, nombre, dia_corte, dia_pago, bancos(nombre)")
    .order("created_at", { ascending: false });

  const proximas = calcularProximas(tarjetas ?? []);
  const hoy = new Date().getDate();
  const diaSemana = new Date().getDay(); // 0=dom, 1=lun...
  const diasRestantesSemana = diaSemana === 0 ? 0 : 7 - diaSemana;

  // === Métricas únicas de alertas (NO repetir dashboard) ===
  // Cortes esta semana (próximos N días)
  const cortesSemana = proximas.filter(
    (f) => f.tipo === "corte" && calcularDiasHasta(f.dia) <= diasRestantesSemana,
  ).length;

  // Pagos que vencen en 7 días
  const pagosProx7 = proximas.filter(
    (f) => f.tipo === "pago" && calcularDiasHasta(f.dia) <= 7,
  ).length;

  // Próxima fecha más cercana
  const primeraFecha = proximas[0] ?? null;

  // Tarjetas con fechas configuradas
  const tarjetasConFechas = (tarjetas ?? []).filter(
    (t) => t.dia_corte || t.dia_pago,
  ).length;

  return (
    <div className={styles["alertas-page"]}>
      <div className={styles["alertas-page__header"]}>
        <div>
          <h1>Mis alertas</h1>
          <p>Las próximas fechas de corte y pago de tus tarjetas.</p>
        </div>
        <Link href="/tarjetas" className={styles["alertas-page__configurar"]}>
          <CreditCardIcon size={16} />
          Configurar tarjetas
        </Link>
      </div>

      {proximas.length > 0 && (
        <div className={styles["alertas-bento-metrics"]}>
          {/* Hero: Próxima fecha */}
          <div className={styles["alertas-bento-metric--hero"]}>
            <div className={styles["alertas-bento-metric__header"]}>
              <BellIcon size={16} />
              <span className={styles["alertas-bento-metric__label"]}>Próxima fecha</span>
            </div>
            <div className={styles["alertas-bento-metric__big-number"]}>
              {primeraFecha
                ? `${primeraFecha.tipo === "corte" ? "Corte" : "Pago"}: Día ${primeraFecha.dia}`
                : "-"
              }
            </div>
            <div className={styles["alertas-bento-metric__sub"]}>
              {primeraFecha
                ? `${primeraFecha.nombre} · ${calcularDiasHasta(primeraFecha.dia) === 0 ? "Hoy" : `En ${calcularDiasHasta(primeraFecha.dia)} día${calcularDiasHasta(primeraFecha.dia) !== 1 ? "s" : ""}`}`
                : "Sin fechas"
              }
            </div>
          </div>

          <div className={styles["alertas-bento-metric--side"]}>
            {/* Cortes esta semana */}
            <div className={styles["alertas-bento-metric__item"]}>
              <div className={styles["alertas-bento-metric__header"]}>
                <ClockIcon size={14} />
                <span className={styles["alertas-bento-metric__label"]}>Cortes esta semana</span>
              </div>
              <div className={styles["alertas-bento-metric__value"]}>
                {cortesSemana}
              </div>
              <div className={styles["alertas-bento-metric__sub"]}>
                Próximos {diasRestantesSemana} días
              </div>
            </div>

            {/* Pagos en 7 días */}
            <div className={styles["alertas-bento-metric__item"]}>
              <div className={styles["alertas-bento-metric__header"]}>
                <BanknoteIcon size={14} />
                <span className={styles["alertas-bento-metric__label"]}>Pagos en 7 días</span>
              </div>
              <div className={styles["alertas-bento-metric__value"]}>
                {pagosProx7}
              </div>
              <div className={styles["alertas-bento-metric__sub"]}>
                Fechas de pago
              </div>
            </div>
          </div>

          <div className={styles["alertas-bento-metric--count"]}>
            <div className={styles["alertas-bento-metric__header"]}>
              <CreditCardIcon size={14} />
              <span className={styles["alertas-bento-metric__label"]}>Con fechas</span>
            </div>
            <div className={styles["alertas-bento-metric__big-number--sm"]}>
              {tarjetasConFechas}
            </div>
            <div className={styles["alertas-bento-metric__sub"]}>
              Tarjeta{(tarjetas ?? []).length !== 1 && "s"}
            </div>
          </div>
        </div>
      )}

      {proximas.length === 0 ? (
        <div className={styles["alertas-page__empty-state"]}>
          <div className={styles["alertas-page__empty-grid"]}>
            <div className={styles["alertas-page__empty-main"]}>
              <BellIcon size={40} />
              <h2>Sin alertas</h2>
              <p>
                Registra tarjetas con fechas de corte y pago para ver tus próximas
                alertas aquí.
              </p>
              <Link href="/tarjetas/nueva" className={styles["alertas-page__configurar"]}>
                Registrar tarjeta
              </Link>
            </div>
            <div className={styles["alertas-page__empty-preview"]}>
              <div className={styles["alertas-page__empty-preview-item"]}>
                <BellIcon size={16} />
                <span>Próxima fecha</span>
              </div>
              <div className={styles["alertas-page__empty-preview-item"]}>
                <ClockIcon size={16} />
                <span>Cortes semana</span>
              </div>
              <div className={styles["alertas-page__empty-preview-item"]}>
                <BanknoteIcon size={16} />
                <span>Pagos 7 días</span>
              </div>
              <div className={styles["alertas-page__empty-preview-item"]}>
                <CreditCardIcon size={16} />
                <span>Con fechas</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <ul className={styles["alertas-page__list"]}>
          {proximas.map((f) => (
            <li key={`${f.tarjetaId}-${f.tipo}`} className={styles["alertas-page__item"]}>
              <div
                className={`${styles["alertas-page__badge"]} ${styles[`alertas-page__badge--${f.tipo}`]}`}
              >
                {f.tipo === "corte" ? (
                  <ClockIcon size={18} />
                ) : (
                  <BanknoteIcon size={18} />
                )}
              </div>
              <div className={styles["alertas-page__info"]}>
                <h3>{f.tipo === "corte" ? "Fecha de corte" : "Fecha de pago"}</h3>
                <p>
                  {f.nombre} · {f.banco}
                </p>
              </div>
              <div className={styles["alertas-page__dia"]}>
                <small>Día</small>
                <strong>{f.dia}</strong>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
