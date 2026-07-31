import { useCallback, useMemo, useState } from "react";
import { api } from "../../../services/api";
import type { Factura, FacturaExtraccion, FacturaInput } from "../../../types";
import { useApiData } from "../../../hooks/useApiData";

const EMPTY: Factura[] = [];

async function fetchFacturas() {
  return api.get<Factura[]>("/facturas");
}

export function useFacturas() {
  const { data: facturas, loading, error, reload } = useApiData(EMPTY, fetchFacturas);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);

  const extraer = useCallback(async (file: File): Promise<FacturaExtraccion> => {
    setExtracting(true);
    try {
      const formData = new FormData();
      formData.append("imagen", file);
      return await api.upload<FacturaExtraccion>("/facturas/extraer", formData);
    } finally {
      setExtracting(false);
    }
  }, []);

  const guardar = useCallback(
    async (input: FacturaInput): Promise<Factura> => {
      setSaving(true);
      try {
        const factura = await api.post<Factura>("/facturas", input);
        await reload();
        return factura;
      } finally {
        setSaving(false);
      }
    },
    [reload],
  );

  const eliminar = useCallback(
    async (id: number) => {
      await api.delete<void>(`/facturas/${id}`);
      await reload();
    },
    [reload],
  );

  return useMemo(
    () => ({ facturas, error, loading, extracting, saving, extraer, guardar, eliminar, reload }),
    [facturas, error, loading, extracting, saving, extraer, guardar, eliminar, reload],
  );
}
