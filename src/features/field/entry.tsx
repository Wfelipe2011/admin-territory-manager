"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fieldRequest, normalizeCode, sessionKey, validCode } from "./api";
import { FieldSession } from "./types";

export function FieldEntry({ code: rawCode }: { code: string }) {
  const code = normalizeCode(rawCode);
  const router = useRouter();
  const [session, setSession] = useState<FieldSession | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  useEffect(() => {
    const abort = new AbortController();
    if (!validCode(code)) {
      setError(
        "Link inválido ou expirado. Solicite um novo link ao responsável.",
      );
      setBusy(false);
      return;
    }
    void fieldRequest<FieldSession>(
      `signature/${encodeURIComponent(code)}`,
      undefined,
      { signal: abort.signal },
    )
      .then(setSession)
      .catch((error) => {
        if (!abort.signal.aborted)
          setError(
            error instanceof Error
              ? error.message
              : "Não foi possível abrir o link.",
          );
      })
      .finally(() => {
        if (!abort.signal.aborted) setBusy(false);
      });
    return () => abort.abort();
  }, [code]);
  const enter = () => {
    if (!session) return;
    try {
      sessionStorage.setItem(
        sessionKey(session.access.code),
        JSON.stringify(session),
      );
      router.push(`/campo/${encodeURIComponent(session.access.code)}`);
    } catch {
      setError("Permita o armazenamento deste site para entrar.");
    }
  };
  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 p-5">
      <section className="w-full max-w-sm rounded-3xl border bg-white p-7 shadow-sm">
        <div className="mb-8 flex justify-center rounded-2xl bg-emerald-950 py-3">
          <Image src="/logo.png" alt="Território Digital" width={160} height={160} priority />
        </div>
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Área de campo
        </span>
        <h1 className="mb-3 mt-3 text-3xl font-semibold leading-tight text-slate-900">
          Seu território,
          <br />
          na palma da mão.
        </h1>
        <p className="text-sm leading-relaxed text-slate-600">
          Acesse a designação recebida e acompanhe o trabalho com sua equipe.
        </p>
        <div className="my-7 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <Link2 size={18} className="text-slate-400" />
          <span className="break-all pl-3 text-right font-mono text-sm font-semibold tracking-widest">
            {code}
          </span>
        </div>
        {session && (
          <p className="mb-5 text-sm text-slate-600">
            {session.access.role === "overseer"
              ? `Olá${
                  session.access.overseer ? `, ${session.access.overseer}` : ""
                }. Gerencie seu território e compartilhe as quadras.`
              : "Veja as ruas da sua quadra e registre as casas trabalhadas."}
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-800"
          >
            {error}
          </p>
        )}
        <Button
          onClick={enter}
          disabled={busy || !session}
          className="h-12 w-full rounded-xl bg-emerald-800 text-white hover:bg-emerald-900"
        >
          {busy ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              Entrar na designação <ArrowRight />
            </>
          )}
        </Button>
        {session && (
          <p className="mt-4 text-center text-xs text-slate-500">
            Válido até{" "}
            {new Date(session.access.expiresAt).toLocaleString("pt-BR")}
          </p>
        )}
        {error && (
          <Button
            variant="ghost"
            className="mt-3 h-11 w-full"
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </Button>
        )}
      </section>
    </main>
  );
}
