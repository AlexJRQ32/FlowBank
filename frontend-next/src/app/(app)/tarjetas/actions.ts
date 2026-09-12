"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type TarjetaState = { error?: string };

const TIPOS = ["Credito", "Debito"] as const;

/** Shared parsers/validators; form actions call this and map to Spanish copy. */
function parseTarjeta(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim() || "Tarjeta";
  const bancoId = String(formData.get("bancoId") ?? "").trim();
  const digitos = String(formData.get("ultimos_cuatro_digitos") ?? "").replace(/\D/g, "");
  const tipo = String(formData.get("tipo") ?? "").trim();
  const diaCorte = Number(formData.get("dia_corte"));
  const diaPago = Number(formData.get("dia_pago"));
  const limite = Number(formData.get("limite_credito"));
  const saldo = Number(formData.get("saldo_actual"));
  const nota = String(formData.get("nota") ?? "").trim();
  const esActiva = formData.get("es_activa") !== null;

  if (!bancoId) return { error: "Selecciona un banco." } as const;
  if (digitos.length !== 4)
    return { error: "Ingresa los ultimos 4 digitos de la tarjeta." } as const;
  if (!TIPOS.includes(tipo as (typeof TIPOS)[number]))
    return { error: "Selecciona un tipo de tarjeta valido." } as const;
  if (!diaCorte || !diaPago)
    return { error: "Indica el dia de corte y el dia de pago." } as const;
  if (diaCorte < 1 || diaCorte > 31 || diaPago < 1 || diaPago > 31)
    return { error: "Los dias de corte y pago deben estar entre 1 y 31." } as const;
  if (!Number.isFinite(limite) || limite < 0 || !Number.isFinite(saldo) || saldo < 0) {
    return { error: "Ingresa montos validos." } as const;
  }

  return {
    fields: {
      nombre,
      banco_id: bancoId,
      ultimos_cuatro_digitos: digitos,
      tipo,
      dia_corte: diaCorte,
      dia_pago: diaPago,
      limite_credito: limite,
      saldo_actual: saldo,
      nota: nota || null,
      es_activa: esActiva,
    },
  } as const;
}

export async function createTarjetaAction(
  _prev: TarjetaState,
  formData: FormData,
): Promise<TarjetaState> {
  const parsed = parseTarjeta(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesion expiro. Inicia sesion de nuevo." };

  const { error } = await supabase
    .from("tarjetas")
    .insert({ ...parsed.fields, user_id: user.id });

  if (error) {
    return { error: "No se pudo guardar la tarjeta. Intenta de nuevo." };
  }

  revalidatePath("/tarjetas");
  revalidatePath("/dashboard");
  redirect("/tarjetas");
}

export async function updateTarjetaAction(
  prev: TarjetaState,
  formData: FormData,
): Promise<TarjetaState> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Tarjeta no encontrada." };

  const parsed = parseTarjeta(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  // RLS scopes the update to the owner's row (USING auth.uid() = user_id);
  // select().single() surfaces the updated row when it exists.
  const { data, error } = await supabase
    .from("tarjetas")
    .update(parsed.fields)
    .eq("id", id)
    .select("id")
    .single();

  if (error) return { error: "No se pudo guardar la tarjeta. Intenta de nuevo." };
  if (!data) return { error: "Tarjeta no encontrada." };

  revalidatePath("/tarjetas");
  revalidatePath("/dashboard");
  redirect("/tarjetas");
}

export async function deleteTarjetaAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  // Server-side double-check of the checkbox confirm (HTML required alone
  // is not a security boundary).
  if (formData.get("confirmar") === null) redirect("/tarjetas");

  const supabase = await createClient();
  await supabase.from("tarjetas").delete().eq("id", id);

  revalidatePath("/tarjetas");
  revalidatePath("/dashboard");
  redirect("/tarjetas");
}
