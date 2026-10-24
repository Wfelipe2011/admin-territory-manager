import { FieldSession } from "./types";

export const fieldApiUrl = `${
  process.env.NEXT_PUBLIC_API_URL || "https://api.territory-manager.com.br"
}/v1`;
export const normalizeCode = (code: string) =>
  /^[a-z0-9]{6}$/i.test(code) ? code.toUpperCase() : code;
export const validCode = (code: string) =>
  /^[A-Z0-9]{6}$/.test(code) ||
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(code);
export const sessionKey = (code: string) => `field:${normalizeCode(code)}`;

export class FieldError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

// Dedicated HTTP client: administrative Axios interceptors/cookies never enter here.
export async function fieldRequest<T>(
  path: string,
  session?: Pick<FieldSession, "token">,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<T> {
  const { timeoutMs = 30000, signal, ...options } = init;
  const abort = new AbortController();
  const cancel = () => abort.abort();
  if (signal?.aborted) cancel();
  else signal?.addEventListener("abort", cancel, { once: true });
  const timer = setTimeout(cancel, timeoutMs);
  try {
    const response = await fetch(`${fieldApiUrl}/${path}`, {
      ...options,
      signal: abort.signal,
      cache: "no-store",
      credentials: "omit",
      headers: {
        "Content-Type": "application/json",
        ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
        ...options.headers,
      },
    });
    const text = await response.text();
    let body: { message?: string | string[] } | null = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        throw new FieldError(
          "Resposta inválida do servidor. Tente novamente.",
          response.ok ? 0 : response.status,
        );
      }
    }
    if (!response.ok)
      throw new FieldError(
        response.status >= 500
          ? "Servidor indisponível. Tente novamente."
          : Array.isArray(body?.message)
          ? body.message.join(". ")
          : body?.message || "Não foi possível concluir. Tente novamente.",
        response.status,
      );
    return body as T;
  } catch (error) {
    if (signal?.aborted || error instanceof FieldError) throw error;
    throw new FieldError(
      abort.signal.aborted
        ? "O servidor demorou para responder. Atualize para conferir o resultado."
        : "Sem conexão com o servidor. Tente novamente.",
      0,
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", cancel);
  }
}

let tabId: string | undefined;
let fallbackClientId: string | undefined;
const randomId = () =>
  typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Array.from(crypto.getRandomValues(new Uint8Array(16)), (n) =>
        n.toString(16).padStart(2, "0"),
      ).join("");
export function fieldIdentity() {
  let clientId: string;
  try {
    clientId = localStorage.getItem("field:client") || randomId();
    localStorage.setItem("field:client", clientId);
  } catch {
    fallbackClientId ??= randomId();
    clientId = fallbackClientId;
  }
  tabId ??= randomId();
  return { clientId, tabId };
}

export function fieldLink(code: string) {
  return `${
    process.env.NEXT_PUBLIC_APP_URL || window.location.origin
  }/acesso/${encodeURIComponent(code)}`;
}
