// Catalog page: legacy handled banks inline from /tarjetas ("Nuevo banco"
// modal); this page replaces the old stand-in placeholder with the full
// borrower catalog listing + the same create modal.
import { CreditCardIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import NuevoBancoButton from "../_components/nuevo-banco-button";
import styles from "./bancos.module.scss";

// Auth-scoped Supabase reads (RLS); must never be cached (Gothic #11).
export const dynamic = "force-dynamic";

export default async function BancosPage() {
  const supabase = await createClient();
  const { data: bancos } = await supabase
    .from("bancos")
    .select("id, nombre, logo_url, es_activo")
    .order("nombre");

  // Count of visible cards per bank (tarjetas owner-scoped by RLS).
  const { data: tarjetas } = await supabase
    .from("tarjetas")
    .select("banco_id");

  const usoPorBanco = new Map<string, number>();
  for (const t of tarjetas ?? []) {
    usoPorBanco.set(t.banco_id, (usoPorBanco.get(t.banco_id) ?? 0) + 1);
  }

  return (
    <div className={styles["bancos-page"]}>
      <div className={styles["bancos-page__header"]}>
        <div>
          <h1>Bancos</h1>
          <p>Catalogo de bancos disponibles para asociar a tus tarjetas.</p>
        </div>
        <NuevoBancoButton className={styles["bancos-page__nuevo"]} />
      </div>

      {!bancos?.length ? (
        <div className={styles["bancos-page__empty"]}>
          <p>No hay bancos en el catalogo. Agrega el primero con &quot;Nuevo banco&quot;.</p>
        </div>
      ) : (
        <ul className={styles["bancos-page__list"]}>
          {bancos.map((b) => (
            <li key={b.id} className={styles["bancos-page__item"]}>
              <span className={styles["bancos-page__logo"]}>
                <CreditCardIcon size={18} />
              </span>
              <span className={styles["bancos-page__nombre"]}>{b.nombre}</span>
              <span className={styles["bancos-page__count"]}>
                {usoPorBanco.get(b.id) ?? 0} tarjeta{(usoPorBanco.get(b.id) ?? 0) !== 1 && "s"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
