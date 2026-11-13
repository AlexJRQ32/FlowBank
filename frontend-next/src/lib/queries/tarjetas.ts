// Debt/limit calculation ported 1:1 from legacy TarjetasController.cs
// (CalcularDeudaReal + ConvertirColonesAUsd + CalcularLimiteDisponible).
import { createClient } from "@/lib/supabase/server";
import { obtenerTipoCambio } from "@/lib/tipo-cambio";
import type { TipoCambioResult } from "@/lib/tipo-cambio";

export interface TarjetaConDeuda {
  id: string;
  nombre: string;
  banco_id: string;
  bancos: { nombre: string } | null;
  tipo: string;
  ultimos_cuatro_digitos: string;
  dia_corte: number | null;
  dia_pago: number | null;
  es_activa: boolean;
  limite_credito: number | null;
  limite_credito_colones: number | null;
  limite_disponible_usd: number | null;
  limite_disponible_colones: number | null;
  total_adeudado_usd: number;
  total_adeudado_colones: number;
}

function convertirColonesAUsd(
  deudaUsd: number,
  deudaColones: number,
  tipoCambio: TipoCambioResult | null,
): number {
  if (tipoCambio?.compra && tipoCambio.compra > 0)
    return round2(deudaUsd + deudaColones / tipoCambio.compra);
  return deudaUsd;
}

function convertirUsdAColones(usd: number, tipoCambio: TipoCambioResult | null): number | null {
  if (tipoCambio?.venta && tipoCambio.venta > 0) return round2(usd * tipoCambio.venta);
  return null;
}

/** Limite restante (limite - deuda total en USD, nunca negativo) + equivalente en colones. */
function calcularLimiteDisponible(
  limiteCredito: number | null,
  totalAdeudadoUsd: number,
  tipoCambio: TipoCambioResult | null,
): { usd: number; colones: number | null } {
  const disponibleUsd = round2(Math.max(0, (limiteCredito ?? 0) - totalAdeudadoUsd));
  return { usd: disponibleUsd, colones: convertirUsdAColones(disponibleUsd, tipoCambio) };
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

/**
 * Tarjetas del usuario con deuda real (por moneda) + limite disponible,
 * usando el tipo de cambio del dia. All server side (Session Component).
 */
export async function getTarjetasConDeuda(): Promise<{
  tarjetas: TarjetaConDeuda[];
  tipoCambio: TipoCambioResult;
}> {
  const supabase = await createClient();

  const [tipoCambio, { data: tarjetas }, { data: facturas }] = await Promise.all([
    obtenerTipoCambio(supabase),
    supabase
      .from("tarjetas")
      .select("id, nombre, banco_id, tipo, ultimos_cuatro_digitos, dia_corte, dia_pago, es_activa, limite_credito, bancos(nombre)")
      .order("created_at", { ascending: false }),
    supabase.from("facturas").select("tarjeta_id, monto_total, moneda"),
  ]);

  const tipo = tipoCambio;

  const lista = (tarjetas ?? []).map((t): TarjetaConDeuda => {
    const deTarjeta = (facturas ?? []).filter((f) => f.tarjeta_id === t.id);
    // Embedded join typing: "bancos(nombre)" arrives as an array per generated
    // types; normalize to a nullable object.
    const bancoJoin = Array.isArray(t.bancos) ? (t.bancos[0] ?? null) : (t.bancos ?? null);
    const banco = bancoJoin as { nombre: string } | null;
    const deudaUsd = round2(
      deTarjeta.filter((f) => f.moneda === "USD").reduce((s, f) => s + Number(f.monto_total), 0),
    );
    const deudaColones = round2(
      deTarjeta.filter((f) => f.moneda !== "USD").reduce((s, f) => s + Number(f.monto_total), 0),
    );
    const deudaUsdCombinada = convertirColonesAUsd(deudaUsd, deudaColones, tipo);

    const limite = Number(t.limite_credito ?? 0) || 0;
    const disponible = calcularLimiteDisponible(limite, deudaUsdCombinada, tipo);

    return {
      id: t.id,
      nombre: t.nombre,
      banco_id: t.banco_id,
      bancos: banco,
      tipo: t.tipo,
      ultimos_cuatro_digitos: t.ultimos_cuatro_digitos,
      dia_corte: t.dia_corte,
      dia_pago: t.dia_pago,
      es_activa: t.es_activa,
      limite_credito: limite || null,
      limite_credito_colones: convertirUsdAColones(limite, tipo),
      limite_disponible_usd: disponible.usd,
      limite_disponible_colones: disponible.colones,
      total_adeudado_usd: deudaUsd,
      total_adeudado_colones: deudaColones,
    };
  });

  return { tarjetas: lista, tipoCambio };
}
