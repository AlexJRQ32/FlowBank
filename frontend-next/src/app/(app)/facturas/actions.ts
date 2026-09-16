"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FacturaState = { error?: string };

const MONEDAS = ["CRC", "USD"] as const;

export async function createFacturaAction(
  _prev: FacturaState,
  formData: FormData,
): Promise<FacturaState> {
  const tarjetaId = String(formData.get("tarjeta_id") ?? "").trim();
  const monto = Number(formData.get("monto_total"));
  const moneda = String(formData.get("moneda") ?? "");
  const fecha = String(formData.get("fecha_compra") ?? "").trim();
  const comercio = String(formData.get("comercio") ?? "").trim();
  const imagen = formData.get("imagen") as File | null;

  if (!monto || monto <= 0) return { error: "Ingresa un monto valido." };
  if (!MONEDAS.includes(moneda as (typeof MONEDAS)[number])) {
    return { error: "Selecciona una moneda valida." };
  }
  const tieneImagen = !!imagen && imagen.size > 0;
  if (tieneImagen && imagen.size > 10 * 1024 * 1024) {
    return { error: "La imagen supera el maximo de 10 MB." };
  }
  if (tieneImagen && imagen.type && !imagen.type.startsWith("image/")) {
    return { error: "El archivo debe ser una imagen (JPG, PNG, WEBP)." };
  }
  // tarjeta_id nullable: "" = "Sin asociar" is allowed (matches legacy).

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesion expiro. Inicia sesion de nuevo." };

  let imagenUrl: string | null = null;
  if (tieneImagen) {
    const ext = (imagen.name.split(".").pop() ?? "jpg").toLowerCase().replace(/\W/g, "");
    const path = `${user.id}/${crypto.randomUUID()}.${ext || "jpg"}`;

    // Bucket 'facturas' created by supabase/migrations/20260912000011 (private,
    // authenticated-only policies scoped to `${auth.uid()}/...` first segment).
    const { error: uploadError } = await supabase.storage
      .from("facturas")
      .upload(path, imagen, {
        contentType: imagen.type || undefined,
        upsert: false,
      });

    if (uploadError) {
      return { error: "No se pudo subir la imagen de la factura. Intenta de nuevo." };
    }
    imagenUrl = path;
  }

  const { error: insertError } = await supabase.from("facturas").insert({
    tarjeta_id: tarjetaId || null,
    monto_total: monto,
    moneda,
    fecha_compra: fecha || null,
    comercio: comercio || null,
    imagen_url: imagenUrl, // storage path; signed URL generated on render (bucket is private)
  });

  if (insertError) {
    return { error: "No se pudo guardar la factura. Intenta de nuevo." };
  }

  revalidatePath("/facturas");
  revalidatePath("/dashboard");
  redirect("/facturas");
}

export async function deleteFacturaAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const supabase = await createClient();
  // RLS: scoped via tarjeta ownership (tarjeta_id IN tarjetas OF auth.uid()).
  await supabase.from("facturas").delete().eq("id", id);

  revalidatePath("/facturas");
  revalidatePath("/dashboard");
}
