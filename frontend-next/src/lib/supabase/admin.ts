// Service-role client — BYPASSES ALL RLS. Only import from Route Handlers /
// Server Actions that need admin writes (tipo-cambio cache refresh); never
// from "use client" code (Gothic Failure #4).
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY no esta configurada en .env.local " +
        "(solo servidor; se requiere para escrituras que RLS rechaza).",
    );
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
