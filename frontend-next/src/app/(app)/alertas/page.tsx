import { BellIcon, CreditCardIcon } from "@/components/icons";
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
    // Embedded join typing: "bancos(nombre)" arrives as an array.
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

export default async function AlertasPage() {
  const supabase = await createClient();
  const { data: tarjetas } = await supabase
    .from("tarjetas")
    .select("id, nombre, dia_corte, dia_pago, bancos(nombre)")
    .order("created_at", { ascending: false });

  const proximas = calcularProximas(tarjetas ?? []);

  return (
    <div className={styles["alertas-page"]}>
      <div className={styles["alertas-page__header"]}>
        <h1>Mis alertas</h1>
        <p>Las proximas fechas de corte y pago de tus tarjetas.</p>
      </div>

      {proximas.length === 0 ? (
        <div className={styles["alertas-page__empty-state"]}>
          <BellIcon size={40} />
          <h2>Sin alertas</h2>
          <p>Registra tarjetas para ver tus proximas fechas de corte y pago.</p>
        </div>
      ) : (
        <ul className={styles["alertas-page__list"]}>
          {proximas.map((f) => (
            <li key={`${f.tarjetaId}-${f.tipo}`} className={styles["alertas-page__item"]}>
              <div
                className={`${styles["alertas-page__badge"]} ${styles[`alertas-page__badge--${f.tipo}`]}`}
              >
                <CreditCardIcon size={18} />
              </div>
              <div className={styles["alertas-page__info"]}>
                <h3>{f.tipo === "corte" ? "Fecha de corte" : "Fecha de pago"}</h3>
                <p>
                  {f.nombre} • {f.banco}
                </p>
              </div>
              <div className={styles["alertas-page__dia"]}>
                <small>Dia</small>
                <strong>{f.dia}</strong>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
