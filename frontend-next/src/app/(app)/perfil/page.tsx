import { createClient } from "@/lib/supabase/server";
import PerfilForm from "./perfil-form";
import styles from "./perfil.module.scss";

// Auth-scoped Supabase reads (RLS); must never be cached (Gothic #11).
export const dynamic = "force-dynamic";

// Port of legacy PerfilPage: visual card + editable nombre/apellido. Email is
// displayed read-only ("edit email" is a NEW feature, out of MVP scope).
export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre, apellido")
    .eq("id", user!.id)
    .single();

  const nombre = profile?.nombre || "";
  const apellido = profile?.apellido || "";
  const inicial = (nombre || user?.email || "U").charAt(0).toUpperCase();

  return (
    <div className={styles["perfil-page"]}>
      <div className={styles["perfil-page__header"]}>
        <h1>Mi perfil</h1>
        <p>Tus datos de cuenta en FlowBank.</p>
      </div>

      <div className={styles["perfil-page__card"]}>
        <div className={styles["perfil-page__avatar"]}>{inicial}</div>
        <dl className={styles["perfil-page__fields"]}>
          <div>
            <dt>Nombre</dt>
            <dd>{nombre || "—"}</dd>
          </div>
          <div>
            <dt>Apellido</dt>
            <dd>{apellido || "—"}</dd>
          </div>
          <div>
            <dt>Correo electronico</dt>
            <dd>{user?.email ?? "—"}</dd>
          </div>
        </dl>
      </div>

      <PerfilForm nombre={nombre} apellido={apellido} />
    </div>
  );
}
