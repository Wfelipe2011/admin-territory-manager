"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fieldRequest, normalizeCode, sessionKey, validCode } from "./api";
import { FieldSession } from "./types";

export function FieldEntry({
  code: rawCode,
  blockId,
  addressId,
  onReady,
}: {
  code: string;
  blockId?: number;
  addressId?: number;
  onReady?: (session: FieldSession) => void;
}) {
  const code = normalizeCode(rawCode);
  const router = useRouter();
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const abort = new AbortController();
    setError("");
    if (!validCode(code)) {
      setError("Link inválido ou expirado. Solicite um novo link ao responsável.");
      return;
    }
    void fieldRequest<FieldSession>(
      `signature/${encodeURIComponent(code)}`,
      undefined,
      { signal: abort.signal },
    )
      .then((session) => {
        if (abort.signal.aborted) return;
        try {
          sessionStorage.setItem(sessionKey(session.access.code), JSON.stringify(session));
        } catch {
          throw new Error("Permita o armazenamento deste site para entrar.");
        }
        const base = `/campo/${encodeURIComponent(session.access.code)}`;
        // Only preserve destinations built from this application's route params.
        const destination = blockId
          ? `${base}/quadra/${blockId}${addressId ? `/rua/${addressId}` : ""}`
          : base;
        if (onReady) onReady(session);
        else router.replace(destination);
      })
      .catch((error) => {
        if (!abort.signal.aborted)
          setError(error instanceof Error ? error.message : "Não foi possível abrir o link.");
      });
    return () => abort.abort();
  }, [code, blockId, addressId, router, attempt, onReady]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 p-6">
      {error ? (
        <section className="w-full max-w-sm rounded-2xl border bg-white p-6">
          <h1 className="text-xl font-semibold">Acesso indisponível</h1>
          <p role="alert" className="my-4 text-sm text-slate-600">{error}</p>
          <Button variant="outline" className="h-12 w-full" onClick={() => setAttempt((value) => value + 1)}>
            Tentar novamente
          </Button>
        </section>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin" aria-hidden />
          <p role="status">Carregando sua designação…</p>
        </div>
      )}
    </main>
  );
}
