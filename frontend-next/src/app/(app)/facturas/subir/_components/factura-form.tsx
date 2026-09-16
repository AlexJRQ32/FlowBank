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

// Resize to max 1600px + JPEG q0.85 via canvas. Fixes the mobile-capture
// failure chain: raw camera blobs (5-12 MB) hit the 60s OCR timeout, HEIC
// from iOS cameras cannot be decoded by tesseract.js on the server, and the
// compressed JPEG replaces the input file so the Storage upload gets a
// browser-renderable image too.
async function comprimirImagen(file: File): Promise<Blob | File> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const max = 1600;
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    return blob ?? file;
  } catch {
    return file; // fallback: server gets the original
  }
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
      const comprimida = await comprimirImagen(file);

      // Swap the form's file too: the Storage upload gets the compressed JPEG
      // (smaller, and HEIC becomes browser-renderable for the signed link).
      if (comprimida !== file) {
        const dt = new DataTransfer();
        dt.items.add(
          new File([comprimida], file.name.replace(/\.[^.]*$/, "") + ".jpg", {
            type: "image/jpeg",
          }),
        );
        if (imagenRef.current) imagenRef.current.files = dt.files;
      }

      const formData = new FormData();
      formData.append("image", comprimida, "factura.jpg");
      const res = await fetch("/api/ocr", { method: "POST", body: formData });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Error de OCR");
      const resultado: OcrResultado = await res.json();
      if (montoInput && resultado.monto > 0) montoInput.value = String(resultado.monto);
      if (fechaInput && resultado.fecha) fechaInput.value = resultado.fecha;
      if (comercioInput && resultado.comercio) comercioInput.value = resultado.comercio;
      if (!resultado.monto && !resultado.fecha && !resultado.comercio) {
        setExtractError("No se detectaron datos automaticamente. Completa los campos a mano.");
      }
    } catch {
      setExtractError("No se pudo leer la factura. Completa los datos a mano y guarda.");
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
        <label htmlFor="imagen">Foto de la factura (opcional)</label>
        <input
          id="imagen"
          name="imagen"
          type="file"
          accept="image/*"
          ref={imagenRef}
          onChange={handleImagenChange}
        />
        <small>
          JPG, PNG, WEBP - maximo 10 MB
          {extracting && " — Extrayendo datos..."}
        </small>
        {extractError && (
          <p className={styles["form-error"]} role="alert">
            {extractError}
          </p>
        )}
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
