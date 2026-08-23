import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@foco/shared";

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof TypeError) return "Não consegui falar com a API. Ela está rodando? (pnpm dev:api)";
  if (e instanceof Error) return e.message;
  return "Algo deu errado.";
}

/**
 * Hook de dados mínimo: busca ao montar e sempre que a tela ganha foco.
 * `refresh()` para pull-to-refresh; `setData` para atualizações otimistas.
 */
export function useQuery<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading((l) => l && true);
    try {
      const result = await fetcherRef.current();
      setData(result);
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load(true);
    }, [load]),
  );

  const refresh = useCallback(() => {
    setRefreshing(true);
    return load(true);
  }, [load]);

  return { data, error, loading, refreshing, refresh, setData, reload: () => load(true) };
}
