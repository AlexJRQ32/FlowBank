// Legacy endpoint: GET /api/TipoCambio -> GET /api/tipo-cambio.
// Cache-first (tipo_cambio_cache via RLS for the current session), then BCCR,
// then open.er-api.com. Cache WRITE needs service_role (RLS denies writes for
// anon + authenticated): if SUPABASE_SERVICE_ROLE_KEY is not set we skip the
// write and still return the live rate.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { obtenerTipoCambio } from "@/lib/tipo-cambio";
import type { TipoCambioResult } from "@/lib/tipo-cambio";

// Auth-adjacent handler: never cached (Gothic #11).
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const resultado: TipoCambioResult = await obtenerTipoCambio(supabase);

  if (resultado.compra !== null && resultado.venta !== null) {
    if (resultado.fuente !== "cache") {
      try {
        const admin = createAdminClient();
        const { error } = await admin
          .from("tipo_cambio_cache")
          .upsert(
            {
              fecha: resultado.fecha,
              compra: resultado.compra,
              venta: resultado.venta,
              fuente: resultado.fuente,
            },
            { onConflict: "fecha" },
          );
        if (error) {
          console.error("[tipo-cambio] cache upsert falló:", error.message);
        }
      } catch (err) {
        // Missing service key -> read-only mode: return live rate without caching.
        console.warn("[tipo-cambio] sin cache write:", err instanceof Error ? err.message : err);
      }
    }

    return NextResponse.json({
      compra: resultado.compra,
      venta: resultado.venta,
      fecha: resultado.fecha,
      fuente: resultado.fuente,
    });
  }

  // Legacy parity: Ok with nulls when every source failed.
  return NextResponse.json({
    compra: null,
    venta: null,
    fecha: resultado.fecha,
    fuente: null,
  });
}
