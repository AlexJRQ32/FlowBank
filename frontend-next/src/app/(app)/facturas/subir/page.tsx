import { createClient } from "@/lib/supabase/server";
import { createFacturaAction } from "../actions";
import FacturaForm from "./_components/factura-form";
import styles from "../../_components/forms.module.scss";

// TODO(OCR): OCR extraction is gated behind the Phase 0 Vercel spike
// (PLAN.md Phase 5). Until validated, users enter data manually here.

export const dynamic = "force-dynamic";

export default async function SubirFacturaPage() {
  const supabase = await createClient();

  const { data: tarjetas } = await supabase
    .from("tarjetas")
    .select("id, nombre, ultimos_cuatro_digitos, bancos(nombre)")
    .eq("es_activa", true)
    .order("created_at", { ascending: false });

  // Cast: plain client inference types the FK embed as an array; runtime is an object.
  type TarjetaEmbed = {
    id: string;
    nombre: string | null;
    ultimos_cuatro_digitos: string | null;
    bancos: { nombre: string } | null;
  };

  const opciones = ((tarjetas ?? []) as unknown as TarjetaEmbed[]).map((t) => ({
    id: t.id,
    nombre: t.nombre ?? "Tarjeta",
    ultimos_cuatro_digitos: t.ultimos_cuatro_digitos ?? "0000",
    banco: t.bancos?.nombre ?? "Banco",
  }));

  return (
    <div className={styles["form-page"]}>
      <header className={styles["form-page__header"]}>
        <h1>Subir factura</h1>
        {/* Legacy copy message kept verbatim; OCR wiring pending spike. */}
        <p>Sube una foto de tu factura con su monto, fecha y comercio.</p>
      </header>
      <section className={styles["form-card"]}>
        <FacturaForm action={createFacturaAction} tarjetas={opciones} />
      </section>
    </div>
  );
}
