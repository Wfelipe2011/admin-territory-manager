"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { adminRequest } from "./api";

const RequestsContext = createContext({
  revision: "",
  pending: 0,
  connected: false,
  refresh: () => {},
});
export const useRequests = () => useContext(RequestsContext);

/** One administrative long poll supplies the badge and all review screens. */
export function RequestsProvider({ children }: { children: React.ReactNode }) {
  const [revision, setRevision] = useState("");
  const [pending, setPending] = useState(0);
  const [connected, setConnected] = useState(false);
  const [generation, setGeneration] = useState(0);
  const refresh = useCallback(() => setGeneration((n) => n + 1), []);
  useEffect(() => {
    const restart = () => refresh();
    document.addEventListener("visibilitychange", restart);
    window.addEventListener("online", restart);
    return () => {
      document.removeEventListener("visibilitychange", restart);
      window.removeEventListener("online", restart);
    };
  }, [refresh]);
  useEffect(() => {
    if (document.hidden) return;
    const abort = new AbortController();
    let cursor = "";
    let retry = 1000;
    let wake: (() => void) | undefined;
    const run = async () => {
      while (!abort.signal.aborted) {
        try {
          const result = await adminRequest<{
            cursor: string;
            pending: number;
          }>(
            `change-requests/sync${
              cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""
            }`,
            { signal: abort.signal, timeoutMs: 35000 },
          );
          if (abort.signal.aborted) break;
          cursor = result.cursor;
          setRevision(cursor);
          setPending(result.pending);
          setConnected(true);
          retry = 1000;
        } catch {
          if (abort.signal.aborted) break;
          setConnected(false);
          await new Promise<void>((resolve) => {
            const timer = setTimeout(resolve, retry);
            wake = () => {
              clearTimeout(timer);
              resolve();
            };
          });
          retry = Math.min(15000, retry * 2);
        }
      }
    };
    void run();
    return () => {
      abort.abort();
      wake?.();
    };
  }, [generation]);
  return (
    <RequestsContext.Provider value={{ revision, pending, connected, refresh }}>
      {children}
    </RequestsContext.Provider>
  );
}
