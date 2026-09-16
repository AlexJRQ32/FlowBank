"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import type { FacturaState } from "../../actions";
import styles from "../../../_components/forms.module.scss";

export interface TarjetaOpcion {
  id: string;
  nombre: string;
  ultimos_cuatro_digitos: string;
  banco: string;
}

interface OcrResultado {
  monto: number;
  fecha: string | null;
  comercio: string;
}

export function FacturaForm({
  action,
  tarjetas,
}: {
  action: (prev: FacturaState, formData: FormData) => Promise<FacturaState>;
  tarjetas: TarjetaOpcion[];
}) {
  const [state, formAction, submitting] = useActionState(action, {} as FacturaState);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const imagenRef = useRef<HTMLInputElement>(null);

  // Legacy UX (frontend/src/features/facturas): on file pick, auto-extract and
  // prefill monto/fecha/comercio; fields stay editable for user review.
  async function handleImagenChange() {
    const file = imagenRef.current?.files?.[0];
    if (!file) return;
    setExtracting(true);
    setExtractError(null);

    const montoInput = document.getElementById("monto_total") as HTMLInputElement | null;
    const fechaInput = document.getElementById("fecha_compra") as HTMLInputElement | null;
    const comercioInput = document.getElementById("comercio") as HTMLInputElement | null;

    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/ocr", { method: "POST", body: formData });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Error de OCR");
      const resultado: OcrResultado = await res.json();
      if (montoInput && resultado.monto > 0) montoInput.value = String(resultado.monto);
      if (fechaInput && resultado.fecha) fechaInput.value = resultado.fecha;
      if (comercioInput && resultado.comercio) comercioInput.value = resultado.comercio;
    } catch {
      setExtractError("No se pudo leer la factura. Completa los datos manualmente.");
    } finally {
      setExtracting(false);
    }
  }

  return (
    <form action={formAction} noValidate>
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
        <input
          id="imagen"
          name="imagen"
          type="file"
          accept="image/*"
          required
          ref={imagenRef}
          onChange={handleImagenChange}
        />
        <small>
          JPG, PNG, WEBP - maximo 10 MB
          {extracting && " — Extrayendo datos..."}
        </small>
        {extractError && <small role="alert">{extractError}</small>}
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
