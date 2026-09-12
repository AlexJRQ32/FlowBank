import { createClient } from "@/lib/supabase/server";
import { createTarjetaAction } from "../actions";
import TarjetaForm from "../_components/tarjeta-form";
import styles from "../../_components/forms.module.scss";

export const dynamic = "force-dynamic";

export default async function NuevaTarjetaPage() {
  const supabase = await createClient();
  const { data: bancos } = await supabase
    .from("bancos")
    .select("id, nombre")
    .eq("es_activo", true)
    .order("nombre");

  return (
    <div className={styles["form-page"]}>
      <header className={styles["form-page__header"]}>
        <h1>Registrar tarjeta</h1>
        <p>Agrega tu tarjeta con sus fechas de corte y pago.</p>
      </header>
      <section className={styles["form-card"]}>
        <TarjetaForm action={createTarjetaAction} bancos={bancos ?? []} />
      </section>
    </div>
  );
}
