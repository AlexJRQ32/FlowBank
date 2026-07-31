import { useCallback, useMemo } from "react";
import { api } from "../../../services/api";
import type { Banco, Tarjeta, TarjetaInput } from "../../../types";
import { useApiData } from "../../../hooks/useApiData";

const EMPTY = { bancos: [] as Banco[], tarjetas: [] as Tarjeta[] };

async function fetchTarjetasData() {
  const [bancosData, tarjetasData] = await Promise.all([
    api.get<Banco[]>("/bancos"),
    api.get<Tarjeta[]>("/tarjetas"),
  ]);
  return { bancos: bancosData, tarjetas: tarjetasData };
}

export function useTarjetasData() {
  const { data, loading, error, reload } = useApiData(EMPTY, fetchTarjetasData);
  const { bancos, tarjetas } = data;

  const saveTarjeta = useCallback(
    async (input: TarjetaInput) => {
      await api.post<Tarjeta>("/tarjetas", input);
      await reload();
    },
    [reload],
  );

  const saveBanco = useCallback(
    async (input: { nombre: string }) => {
      await api.post<Banco>("/bancos", input);
      await reload();
    },
    [reload],
  );

  const deleteTarjeta = useCallback(
    async (id: number) => {
      await api.delete<void>(`/tarjetas/${id}`);
      await reload();
    },
    [reload],
  );

  const getBanco = useCallback(
    (bancoId: number) => bancos.find((b) => b.id === bancoId),
    [bancos],
  );

  return useMemo(
    () => ({
      bancos,
      tarjetas,
      error,
      loading,
      saveTarjeta,
      saveBanco,
      deleteTarjeta,
      getBanco,
      reload,
    }),
    [bancos, tarjetas, error, loading, saveTarjeta, saveBanco, deleteTarjeta, getBanco, reload],
  );
}
