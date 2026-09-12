// Port of legacy backend TipoCambioService.cs (memory cache -> tipo_cambio_cache
// DB table). BCCR (SDDE) is the primary source: token CSRF + indicators cuadro.
// Fallback: open.er-api.com. Cache freshness mirrors the legacy 1h TTL.

import type { SupabaseClient } from "@supabase/supabase-js";

export interface TipoCambioResult {
  compra: number | null;
  venta: number | null;
  fecha: string; // yyyy-MM-dd (today, CR context)
  fuente: "bccr" | "fallback" | "cache" | null;
}

export interface TipoCambioRow {
  compra: number;
  venta: number;
}

const BCCR_TIMEOUT_MS = 15_000;

const TOKEN_URL =
  "https://apim.bccr.fi.cr/SDDE/api/Bccr.GE.SDDE.IndicadoresSitioExterno.ServiciosUsuario.API/Token/GenereCSRF";

const CUADRO_URL =
  "https://apim.bccr.fi.cr/SDDE/api/Bccr.GE.SDDE.IndicadoresSitioExterno.GrupoVariables.API/CuadroGrupoVariables/ObtenerDatosCuadro";

// Exchange-rate indicator ids: 317 = compra, 318 = venta (legacy parity).
const INDICADOR_COMPRA = 317;
const INDICADOR_VENTA = 318;

function fechaHoy(): string {
  // Local server date, same semantics as legacy DateTime.Today.
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Legacy ParseValorBccr: es-CR formats use comma as decimal separator
// (optionally dot as thousands). Normalize defensively.
export function parseValorBccr(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const limpio = raw
    .trim()
    .replace(/\s|\u00A0/g, "")
    .replace(/\.(?=\d{3}\b)/g, "") // thousands dots
    .replace(",", ".");
  const valor = Number(limpio);
  return Number.isFinite(valor) ? valor : null;
}

/** Cached DB row (fecha = today); null if missing or older than 1h. */
export async function leerCacheHoy(
  supabase: SupabaseClient,
): Promise<{ compra: number; venta: number } | null> {
  const hoy = fechaHoy();
  const { data, error } = await supabase
    .from("tipo_cambio_cache")
    .select("compra, venta, fetched_at")
    .eq("fecha", hoy)
    .maybeSingle();

  if (error || !data) return null;

  const fetchedAt = Date.parse(data.fetched_at);
  const unaHora = 60 * 60 * 1000;
  if (!Number.isFinite(fetchedAt) || Date.now() - fetchedAt > unaHora) return null;

  return { compra: Number(data.compra), venta: Number(data.venta) };
}

async function obtenerDeBccr(): Promise<{ compra: number; venta: number } | null> {
  try {
    // NOTE: BCCR may reject requests from non-CR IPs (e.g. Vercel serverless
    // regions). Token + Referer flow verified locally from CR; cannot be tested
    // outside CR — if production fails, fuente='fallback' covers the miss.
    const resToken = await fetch(TOKEN_URL, {
      signal: AbortSignal.timeout(BCCR_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!resToken.ok) return null;
    const token = (await resToken.text()).trim().replace(/^"|"$/g, "");

    const hoy = fechaHoy();
    const url =
      `${CUADRO_URL}?IdGrupoVariable=1` +
      `&FechaInicio=${hoy}T00%3A00%3A00` +
      `&FechaFin=${hoy}` +
      `&CantidadSeriesAMostrar=3`;

    const res = await fetch(url, {
      headers: {
        token_csrf: token,
        Referer:
          "https://sdd.bccr.fi.cr/es/IndicadoresEconomicos/Inicio/Contenedor/6?Cuadro=1",
      },
      signal: AbortSignal.timeout(BCCR_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) return null;

    const json = (await res.json()) as {
      indicadoresRaiz?: Array<{
        idIndicador?: number;
        series?: Record<string, string | null>;
      }>;
    };

    let compra: number | null = null;
    let venta: number | null = null;

    for (const indicador of json.indicadoresRaiz ?? []) {
      const valor = parseValorBccr(indicador.series?.serie3);
      if (valor === null) continue;
      if (indicador.idIndicador === INDICADOR_COMPRA) compra = valor;
      if (indicador.idIndicador === INDICADOR_VENTA) venta = valor;
    }

    if (compra === null || venta === null) return null;
    return { compra, venta };
  } catch {
    return null;
  }
}

async function obtenerDeFallback(): Promise<{ compra: number; venta: number } | null> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal: AbortSignal.timeout(BCCR_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { rates?: Record<string, number> };
    const tasa = json.rates?.CRC;
    if (!tasa || !Number.isFinite(tasa)) return null;
    return { compra: tasa, venta: tasa };
  } catch {
    return null;
  }
}

/** Cache-first: DB row today (<=1h) -> BCCR -> open.er-api.com. */
export async function obtenerTipoCambio(
  supabase: SupabaseClient,
): Promise<TipoCambioResult> {
  const cacheado = await leerCacheHoy(supabase);
  if (cacheado) {
    return { compra: cacheado.compra, venta: cacheado.venta, fecha: fechaHoy(), fuente: "cache" };
  }

  const bccr = await obtenerDeBccr();
  if (bccr) return { compra: bccr.compra, venta: bccr.venta, fecha: fechaHoy(), fuente: "bccr" };

  const fallback = await obtenerDeFallback();
  if (fallback) {
    return { compra: fallback.compra, venta: fallback.venta, fecha: fechaHoy(), fuente: "fallback" };
  }

  return { compra: null, venta: null, fecha: fechaHoy(), fuente: null };
}
