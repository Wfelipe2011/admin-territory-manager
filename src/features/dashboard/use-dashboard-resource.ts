"use client";

import { useCallback, useEffect, useState } from "react";
import { adminRequest } from "@/features/requests/api";

export function useDashboardResource<T>(path: string | null) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{
    path: string | null;
    data: T | null;
    error: string;
    loading: boolean;
  }>({ path: null, data: null, error: "", loading: false });
  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    if (!path) return;
    const abort = new AbortController();
    setState({ path, data: null, error: "", loading: true });
    void adminRequest<T>(path, { signal: abort.signal })
      .then((data) => {
        if (!abort.signal.aborted) setState({ path, data, error: "", loading: false });
      })
      .catch((error) => {
        if (!abort.signal.aborted) setState({
          path, data: null, loading: false,
          error: error instanceof Error ? error.message : "Não foi possível carregar esta seção.",
        });
      });
    return () => abort.abort();
  }, [path, attempt]);

  // A selection change must never display the previous round while its effect starts.
  return { ...(state.path === path && path ? state : { data: null, error: "", loading: !!path }), reload };
}
