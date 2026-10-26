"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import { adminRequest } from '@/features/requests/api';

/** Preserve a successful snapshot only for the same filters; never mix scopes. */
export function useResource<T>(path: string | null, paused = false) {
  const [generation, setGeneration] = useState(0);
  const [state, setState] = useState<{ path: string | null; data: T | null; error: string; loading: boolean; updatedAt: string | null }>({ path: null, data: null, error: '', loading: false, updatedAt: null });
  const refresh = useCallback(() => setGeneration(value => value + 1), []);
  const pausedRef = useRef(paused);
  useEffect(() => { const resumed = pausedRef.current && !paused; pausedRef.current = paused; if (resumed) refresh(); }, [paused, refresh]);
  useEffect(() => {
    if (!path) return;
    const abort = new AbortController();
    let pending = false;
    const load = async () => {
      if (pending || abort.signal.aborted) return;
      pending = true;
      setState(old => ({ path, data: old.path === path ? old.data : null, updatedAt: old.path === path ? old.updatedAt : null, error: '', loading: true }));
      try {
        const data = await adminRequest<T>(path, { signal: abort.signal, timeoutMs: 15000 });
        if (!abort.signal.aborted) setState({ path, data, updatedAt: new Date().toISOString(), error: '', loading: false });
      } catch (error) {
        if (!abort.signal.aborted) setState(old => ({ ...old, path, error: error instanceof Error ? error.message : 'Não foi possível atualizar.', loading: false }));
      } finally { pending = false; }
    };
    void load();
    const automatic = () => { if (!pausedRef.current && !document.hidden && navigator.onLine) void load(); };
    const timer = window.setInterval(automatic, 30000);
    document.addEventListener('visibilitychange', automatic);
    window.addEventListener('online', automatic);
    return () => { abort.abort(); clearInterval(timer); document.removeEventListener('visibilitychange', automatic); window.removeEventListener('online', automatic); };
  }, [path, generation]);
  return { ...(path && state.path === path ? state : { path, data: null, updatedAt: null, error: '', loading: !!path }), refresh };
}
