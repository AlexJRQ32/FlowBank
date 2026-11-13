"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type BancoState = { error?: string; ok?: string };

// Legacy parity (BancoFormModal): users can add banks to the catalog
// (INSERT requires migration 20260912000013_bancos_insert_policy).
export async function createBancoAction(
  _prev: BancoState,
  formData: FormData,
): Promise<BancoState> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return { error: "Ingresa el nombre del banco." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesion expiro. Inicia sesion de nuevo." };

  const { error } = await supabase.from("bancos").insert({ nombre });

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya existe un banco con ese nombre." };
    }
    return { error: "No se pudo guardar el banco. Intenta de nuevo." };
  }

  revalidatePath("/bancos");
  revalidatePath("/tarjetas");
  revalidatePath("/dashboard");
  return { ok: nombre };
}
