"use client";

import { useCallback, useEffect, useState } from "react";
import { readPublisher } from "./store";
import { PublisherData } from "./types";

export function usePublisher() {
  const [data, setData] = useState<PublisherData | null>(null);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    try {
      setData(await readPublisher());
      setError("");
    } catch {
      setError(
        "Não foi possível acessar os dados locais. Permita o armazenamento deste site e tente novamente.",
      );
    }
  }, []);
  useEffect(() => {
    void refresh();
    const changed = () => {
      void refresh();
    };
    const channel =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel("publisher-data")
        : null;
    channel?.addEventListener("message", changed);
    window.addEventListener("publisher-changed", changed);
    window.addEventListener("focus", changed);
    return () => {
      channel?.close();
      window.removeEventListener("publisher-changed", changed);
      window.removeEventListener("focus", changed);
    };
  }, [refresh]);
  return { data, error, refresh };
}

export function useLocalAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const run = async (action: () => Promise<unknown>, done?: () => void) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await action();
      done?.();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar no aparelho. Confira o espaço disponível e tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, setError, run };
}
