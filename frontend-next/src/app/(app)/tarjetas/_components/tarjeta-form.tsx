"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { TarjetaState } from "../actions";
import styles from "../../_components/forms.module.scss";

const TIPOS = ["Credito", "Debito"] as const;

export interface BancoOpcion {
  id: string;
  nombre: string;
}

export interface TarjetaDefaults {
  id?: string;
  nombre?: string;
  banco_id?: string;
  ultimos_cuatro_digitos?: string;
  tipo?: string;
  dia_corte?: number | null;
  dia_pago?: number | null;
  limite_credito?: number | null;
  saldo_actual?: number | null;
  nota?: string | null;
  es_activa?: boolean;
}

export function TarjetaForm({
  action,
  bancos,
  defaults = {},
  submitLabel = "Guardar tarjeta",
}: {
  action: (prev: TarjetaState, formData: FormData) => Promise<TarjetaState>;
  bancos: BancoOpcion[];
  defaults?: TarjetaDefaults;
  submitLabel?: string;
}) {
  const [state, formAction, submitting] = useActionState(action, {} as TarjetaState);

  return (
    <form action={formAction} noValidate>
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}

      <div className={styles["form-row"]}>
        <div className={styles["form-field"]}>
          <label htmlFor="nombre">Nombre de la tarjeta</label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            defaultValue={defaults.nombre ?? ""}
            placeholder="Ej: Visa BCR"
            autoComplete="off"
          />
        </div>
        <div className={styles["form-field"]}>
          <label htmlFor="banco_id">Banco</label>
          <select id="banco_id" name="banco_id" defaultValue={defaults.banco_id ?? ""} required>
            {bancos.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles["form-row"]}>
        <div className={styles["form-field"]}>
          <label htmlFor="ultimos_cuatro_digitos">Ultimos 4 digitos</label>
          <input
            id="ultimos_cuatro_digitos"
            name="ultimos_cuatro_digitos"
            type="text"
            inputMode="numeric"
            maxLength={4}
            defaultValue={defaults.ultimos_cuatro_digitos ?? ""}
            placeholder="2841"
            autoComplete="off"
          />
        </div>
        <div className={styles["form-field"]}>
          <label htmlFor="tipo">Tipo</label>
          <select id="tipo" name="tipo" defaultValue={defaults.tipo ?? TIPOS[0]}>
            {TIPOS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles["form-row"]}>
        <div className={styles["form-field"]}>
          <label htmlFor="dia_corte">Dia de corte</label>
          <input
            id="dia_corte"
            name="dia_corte"
            type="number"
            min={1}
            max={31}
            defaultValue={defaults.dia_corte ?? ""}
            placeholder="15"
          />
        </div>
        <div className={styles["form-field"]}>
          <label htmlFor="dia_pago">Dia de pago</label>
          <input
            id="dia_pago"
            name="dia_pago"
            type="number"
            min={1}
            max={31}
            defaultValue={defaults.dia_pago ?? ""}
            placeholder="02"
          />
        </div>
      </div>

      <div className={styles["form-row"]}>
        <div className={styles["form-field"]}>
          <label htmlFor="limite_credito">Limite de credito (USD)</label>
          <input
            id="limite_credito"
            name="limite_credito"
            type="number"
            min={0}
            step="0.01"
            defaultValue={defaults.limite_credito ?? ""}
            placeholder="0.00"
          />
        </div>
        <div className={styles["form-field"]}>
          <label htmlFor="saldo_actual">Saldo actual (CRC)</label>
          <input
            id="saldo_actual"
            name="saldo_actual"
            type="number"
            min={0}
            step="0.01"
            defaultValue={defaults.saldo_actual ?? 0}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className={styles["form-field"]}>
        <label htmlFor="nota">Nota</label>
        <textarea
          id="nota"
          name="nota"
          defaultValue={defaults.nota ?? ""}
          placeholder="Anotaciones sobre tu tarjeta"
        />
      </div>

      <div className={styles["form-check"]}>
        <input
          id="es_activa"
          name="es_activa"
          type="checkbox"
          defaultChecked={defaults.es_activa ?? true}
        />
        <label htmlFor="es_activa">Tarjeta activa</label>
      </div>

      {state.error && (
        <p className={styles["form-error"]} role="alert">
          {state.error}
        </p>
      )}

      <div className={styles["form-actions"]}>
        <Link href="/tarjetas" className={styles["form-btn--ghost"]}>
          Cancelar
        </Link>
        <button
          type="submit"
          className={styles["form-btn--primary"]}
          disabled={submitting}
        >
          {submitting ? "Guardando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default TarjetaForm;
