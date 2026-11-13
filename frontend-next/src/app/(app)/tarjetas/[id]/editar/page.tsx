import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateTarjetaAction, deleteTarjetaAction } from "../../actions";
import TarjetaForm from "../../_components/tarjeta-form";
import styles from "../../../_components/forms.module.scss";

export const dynamic = "force-dynamic";

export default async function EditarTarjetaPage({
  params,
}: PageProps<"/tarjetas/[id]/editar">) {
  const { id } = await params;
  const supabase = await createClient();

  // RLS scope: another user's id resolves to no row → 404.
  const [{ data: tarjeta }, { data: bancos }] = await Promise.all([
    supabase
      .from("tarjetas")
      .select("id, nombre, banco_id, ultimos_cuatro_digitos, tipo, dia_corte, dia_pago, limite_credito, saldo_actual, nota, es_activa")
      .eq("id", id)
      .single(),
    supabase.from("bancos").select("id, nombre").eq("es_activo", true).order("nombre"),
  ]);

  if (!tarjeta) notFound();

  return (
    <div className={styles["form-page"]}>
      <header className={styles["form-page__header"]}>
        <h1>Editar tarjeta</h1>
        <p>Actualiza los datos de tu tarjeta.</p>
      </header>
      <section className={styles["form-card"]}>
        <TarjetaForm
          action={updateTarjetaAction}
          bancos={bancos ?? []}
          defaults={tarjeta}
          submitLabel="Guardar cambios"
        />

        {/* Deliberately minimal: checkbox-confirm delete per plan scope. */}
        <form action={deleteTarjetaAction} className={styles["form-field"]}>
          <input type="hidden" name="id" value={tarjeta.id} />
          <details>
            <summary>Zona de riesgo: eliminar tarjeta</summary>
            <small>
              Se eliminara la tarjeta y todas sus facturas asociadas. Esta accion no se puede deshacer.
            </small>
            <div className={styles["form-actions"]} style={{ marginTop: "0.5rem" }}>
              <label className={styles["form-check"]}>
                <input name="confirmar" type="checkbox" required />
                Confirmo eliminar esta tarjeta
              </label>
            </div>
            <div className={styles["form-actions"]}>
              <button type="submit" className={styles["form-btn--danger"]}>
                Eliminar tarjeta
              </button>
            </div>
          </details>
        </form>
      </section>
    </div>
  );
}
