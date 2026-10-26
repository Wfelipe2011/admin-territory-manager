"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type InstallPrompt = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
type PwaState = {
  ready: boolean;
  updateAvailable: boolean;
  canInstall: boolean;
  error: string;
  install(): Promise<void>;
  update(): void;
  prepare(): void;
};
const Context = createContext<PwaState>({
  ready: false,
  updateAvailable: false,
  canInstall: false,
  error: "",
  install: async () => {},
  update: () => {},
  prepare: () => {},
});

export function PwaProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const registration = useRef<ServiceWorkerRegistration | null>(null);
  const reloadRequested = useRef(false);
  useEffect(() => {
    const install = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const installed = () => setPrompt(null);
    window.addEventListener("beforeinstallprompt", install);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", install);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      setError(
        "Este navegador não permite preparar o uso offline nesta conexão. Use HTTPS ou localhost em um navegador compatível.",
      );
      return;
    }
    if (
      process.env.NODE_ENV !== "production" &&
      process.env.NEXT_PUBLIC_ENABLE_PWA !== "true"
    ) {
      setError(
        "O uso offline é preparado no build de produção. O servidor de desenvolvimento mantém seus dados locais, mas não instala o cache offline.",
      );
      return;
    }
    let disposed = false;
    const subscriptions: Array<() => void> = [];
    const changed = () => {
      if (reloadRequested.current) window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", changed);
    const register = async () => {
      try {
        setError("");
        const result = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        if (disposed) return;
        registration.current = result;
        setUpdateAvailable(!!result.waiting);
        const watch = () => {
          const worker = result.installing;
          if (!worker) return;
          const state = () => {
            if (disposed) return;
            if (worker.state === "installed" && result.waiting)
              setUpdateAvailable(true);
            if (worker.state === "redundant")
              setError(
                "Não foi possível preparar a atualização offline. Tente novamente com conexão.",
              );
          };
          worker.addEventListener("statechange", state);
          subscriptions.push(() =>
            worker.removeEventListener("statechange", state),
          );
        };
        watch();
        result.addEventListener("updatefound", watch);
        subscriptions.push(() =>
          result.removeEventListener("updatefound", watch),
        );
        await navigator.serviceWorker.ready;
        if (!disposed) setReady(true);
      } catch {
        if (!disposed)
          setError(
            "Uso offline ainda não preparado. Conecte-se e tente novamente.",
          );
      }
    };
    void register();
    return () => {
      disposed = true;
      subscriptions.forEach((remove) => remove());
      navigator.serviceWorker.removeEventListener("controllerchange", changed);
    };
  }, [attempt]);
  return (
    <Context.Provider
      value={{
        ready,
        updateAvailable,
        canInstall: !!prompt,
        error,
        prepare: () => setAttempt((value) => value + 1),
        install: async () => {
          if (prompt) {
            await prompt.prompt();
            await prompt.userChoice;
            setPrompt(null);
          }
        },
        update: () => {
          if (registration.current?.waiting) {
            reloadRequested.current = true;
            registration.current.waiting.postMessage({ type: "ACTIVATE" });
          }
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const usePwa = () => useContext(Context);
