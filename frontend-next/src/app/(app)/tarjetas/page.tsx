import Link from "next/link";
import { CreditCardIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import TarjetaCard from "./_components/tarjeta-card";
import styles from "./tarjetas.module.scss";

// Auth-scoped Supabase reads (RLS); must never be cached (Gothic #11).
export const dynamic = "force-dynamic";

export default async function TarjetasPage() {
  const supabase = await createClient();

  const { data: tarjetas } = await supabase
    .from("tarjetas")
    .select("*, bancos(nombre)")
    .order("created_at", { ascending: false });

  return (
    <div className={styles["tarjetas-page"]}>
      <div className={styles["tarjetas-page__header"]}>
        <div>
          <h1>Mis tarjetas</h1>
          <p>Administra todas tus tarjetas de credito y sus fechas.</p>
        </div>
        <Link href="/tarjetas/nueva" className={styles["tarjetas-page__nueva"]}>
          <CreditCardIcon size={16} />
          Nueva tarjeta
        </Link>
      </div>

      {!tarjetas?.length ? (
        <div className={styles["tarjetas-page__empty-state"]}>
          <CreditCardIcon size={40} />
          <h2>Sin tarjetas todavia</h2>
          <p>Registra tu primera tarjeta para empezar a controlar tus fechas.</p>
          <Link href="/tarjetas/nueva" className={styles["tarjetas-page__nueva"]}>
            Registrar tarjeta
          </Link>
        </div>
      ) : (
        // Card click deep-links into the edit view (ponytail: no detail page yet).
        <ul className={styles["tarjetas-page__grid"]}>
          {tarjetas.map((tarjeta) => (
            <TarjetaCard key={tarjeta.id} tarjeta={tarjeta} />
          ))}
        </ul>
      )}
    </div>
  );
}
