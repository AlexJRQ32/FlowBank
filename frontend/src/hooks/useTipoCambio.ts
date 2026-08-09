import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";
import type { TipoCambio } from "../types";

const SIN_TIPO_CAMBIO: TipoCambio = { compra: null, venta: null, fecha: null };

let cacheGlobal: TipoCambio | null = null;
let promesaEnCurso: Promise<TipoCambio> | null = null;

async function cargarTipoCambio(): Promise<TipoCambio> {
  try {
    return await api.get<TipoCambio>("/tipocambio");
  } catch {
    return SIN_TIPO_CAMBIO;
  }
}

/**
 * Hook que expone el tipo de cambio USD -> CRC del BCCR (con fallback).
 * Cachea el resultado a nivel de modulo para no repetir la llamada.
 */
export function useTipoCambio() {
  const [tipoCambio, setTipoCambio] = useState<TipoCambio>(cacheGlobal ?? SIN_TIPO_CAMBIO);

  useEffect(() => {
    if (cacheGlobal) return;

    if (!promesaEnCurso) {
      promesaEnCurso = cargarTipoCambio()
        .then((tc) => {
          cacheGlobal = tc;
          return tc;
        })
        .finally(() => {
          promesaEnCurso = null;
        });
    }

    let activo = true;
    promesaEnCurso.then((tc) => {
      if (activo) setTipoCambio(tc);
    });

    return () => {
      activo = false;
    };
  }, []);

  const recargar = useCallback(async () => {
    cacheGlobal = null;
    const tc = await cargarTipoCambio();
    cacheGlobal = tc;
    setTipoCambio(tc);
  }, []);

  return { tipoCambio, recargar };
}
