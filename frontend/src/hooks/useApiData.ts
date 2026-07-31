import { useCallback, useEffect, useRef, useState } from "react";

interface ApiDataState<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

/**
 * Hook genérico para fetching de datos con manejo de race conditions.
 * Usa un flag de cancelación para descartar respuestas obsoletas
 * (patrón recomendado por React para sync with effects).
 */
export function useApiData<T>(initialData: T, fetcher: () => Promise<T>) {
  const [state, setState] = useState<ApiDataState<T>>({
    data: initialData,
    loading: true,
    error: null,
  });
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetcherRef.current();
      setState({ data, loading: false, error: null });
    } catch (err: unknown) {
      setState({
        data: initialData,
        loading: false,
        error: err instanceof Error ? err.message : "Error al cargar datos",
      });
    }
  }, [initialData]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const data = await fetcherRef.current();
        if (!cancelled) setState({ data, loading: false, error: null });
      } catch (err: unknown) {
        if (!cancelled) {
          setState({
            data: initialData,
            loading: false,
            error: err instanceof Error ? err.message : "Error al cargar datos",
          });
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [fetcher, initialData]);

  return { ...state, reload: load };
}
