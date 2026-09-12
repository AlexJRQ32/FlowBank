"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PerfilState = { error?: string; ok?: boolean };

export async function updatePerfilAction(
  _prev: PerfilState,
  formData: FormData,
): Promise<PerfilState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesion expiro. Inicia sesion de nuevo." };

  const nombre = String(formData.get("nombre") ?? "").trim();
  const apellido = String(formData.get("apellido") ?? "").trim();

  if (!nombre) return { error: "Ingresa tu nombre." };

  // RLS scopes the update to own row (USING auth.uid() = id). Email change is
  // out of MVP scope (plan section 6: dropped like legacy) — not offered here.
  const { error } = await supabase
    .from("profiles")
    .update({ nombre, apellido })
    .eq("id", user.id);

  if (error) return { error: "No se pudo guardar el perfil. Intenta de nuevo." };

  revalidatePath("/perfil");
  revalidatePath("/dashboard");
  return { ok: true };
}
