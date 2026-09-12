"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { FacturaState } from "../../actions";
import styles from "../../../_components/forms.module.scss";

export interface TarjetaOpcion {
  id: string;
  nombre: string;
  ultimos_cuatro_digitos: string;
  banco: string;
}

export function FacturaForm({
  action,
  tarjetas,
}: {
  action: (prev: FacturaState, formData: FormData) => Promise<FacturaState>;
  tarjetas: TarjetaOpcion[];
}) {
  const [state, formAction, submitting] = useActionState(action, {} as FacturaState);

  return (
    <form action={formAction} noValidate>
      {/* TODO(OCR): once the Phase 0 Vercel spike passes, this form receives
          auto-extracted monto/fecha/comercio from POST /api/ocr (port of
          legacy OcrService.cs); fields below stay manually editable for
          user review, matching the legacy "Revisa los datos extraidos" UX. */}
      {state.error && (
        <p className={styles["form-error"]} role="alert">
          {state.error}
        </p>
      )}

      <div className={styles["form-row"]}>
        <div className={styles["form-field"]}>
          <label htmlFor="monto_total">Monto total</label>
          <input
            id="monto_total"
            name="monto_total"
            type="number"
            step="0.01"
            placeholder="0.00"
            required
          />
        </div>
        <div className={styles["form-field"]}>
          <label htmlFor="moneda">Moneda</label>
          <select id="moneda" name="moneda" defaultValue="CRC">
            <option value="CRC">Colones (₡)</option>
            <option value="USD">Dolares ($)</option>
          </select>
        </div>
      </div>

      <div className={styles["form-field"]}>
        <label htmlFor="fecha_compra">Fecha de compra</label>
        <input id="fecha_compra" name="fecha_compra" type="date" />
      </div>

      <div className={styles["form-field"]}>
        <label htmlFor="comercio">Comercio</label>
        <input
          id="comercio"
          name="comercio"
          type="text"
          placeholder="Nombre del comercio"
          autoComplete="off"
        />
      </div>

      <div className={styles["form-field"]}>
        <label htmlFor="tarjeta_id">Asociar a tarjeta</label>
        <select id="tarjeta_id" name="tarjeta_id" defaultValue="">
          <option value="">Sin asociar</option>
          {tarjetas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre} •••• {t.ultimos_cuatro_digitos} ({t.banco})
            </option>
          ))}
        </select>
      </div>

      <div className={styles["form-field"]}>
        <label htmlFor="imagen">Foto de la factura</label>
        <input id="imagen" name="imagen" type="file" accept="image/*" required />
        <small>JPG, PNG, WEBP - maximo 10 MB</small>
      </div>

      <div className={styles["form-actions"]}>
        <Link href="/facturas" className={styles["form-btn--ghost"]}>
          Cancelar
        </Link>
        <button type="submit" className={styles["form-btn--primary"]} disabled={submitting}>
          {submitting ? "Guardando..." : "Guardar factura"}
        </button>
      </div>
    </form>
  );
}

export default FacturaForm;
