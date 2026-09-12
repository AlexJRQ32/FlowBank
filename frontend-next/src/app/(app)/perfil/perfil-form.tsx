"use client";

import { useActionState } from "react";
import { updatePerfilAction, type PerfilState } from "./actions";
import styles from "./perfil.module.scss";

export function PerfilForm({
  nombre,
  apellido,
}: {
  nombre: string;
  apellido: string;
}) {
  const [state, formAction, submitting] = useActionState(
    updatePerfilAction,
    {} as PerfilState,
  );

  return (
    <form action={formAction} noValidate className={styles["perfil-page__form"]}>
      <div>
        <label htmlFor="nombre">Nombre</label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          defaultValue={nombre}
          maxLength={80}
          autoComplete="given-name"
        />
      </div>
      <div>
        <label htmlFor="apellido">Apellido</label>
        <input
          id="apellido"
          name="apellido"
          type="text"
          defaultValue={apellido}
          maxLength={80}
          autoComplete="family-name"
        />
      </div>

      {state.error && (
        <p className={styles["perfil-page__form-error"]} role="alert">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className={styles["perfil-page__form-ok"]}>Perfil actualizado.</p>
      )}

      <button type="submit" disabled={submitting}>
        {submitting ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}

export default PerfilForm;
