"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; notice?: string };

/**
 * Maps Supabase Auth errors to the legacy Spanish copy.
 * Password mismatch → "Correo o contraseña incorrectos." (matches backend copy
 * shown by the legacy LoginPage on 401).
 */
function toSpanishError(message: string): string {
  const normalized = message.toLowerCase();
  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("email not confirmed")
  ) {
    return "Correo o contraseña incorrectos.";
  }
  if (normalized.includes("already registered")) {
    return "Ya existe una cuenta con este correo electronico.";
  }
  if (normalized.includes("rate limit")) {
    return "Demasiados intentos. Intenta de nuevo en unos minutos.";
  }
  if (
    normalized.includes("password") &&
    (normalized.includes("short") ||
      normalized.includes("weak") ||
      normalized.includes("least"))
  ) {
    return "La contraseña es muy corta. Usa al menos 6 caracteres.";
  }
  return "Intenta de nuevo.";
}

export async function signInAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Ingresa tu correo y contraseña." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.status === 400 ? "Correo o contraseña incorrectos." : toSpanishError(error.message) };
  }

  redirect("/dashboard");
}

export async function signUpAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const apellido = String(formData.get("apellido") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!nombre || !apellido || !email || !password) {
    return { error: "Completa todos los campos." };
  }

  const supabase = await createClient();
  // nombre/apellido go in user metadata so the profiles trigger
  // (migration 00000000000010) can populate the profile row.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nombre, apellido } },
  });

  if (error) {
    return { error: toSpanishError(error.message) };
  }

  // No session → email confirmation required (Supabase default).
  if (!data.session) {
    return {
      notice: "Cuenta creada. Revisa tu correo para confirmar tu cuenta antes de iniciar sesion.",
    };
  }

  redirect("/dashboard");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
