import { parseCookies } from "nookies";
import { fieldRequest } from "../field/api";

export function adminRequest<T>(
  path: string,
  options: RequestInit & { timeoutMs?: number } = {},
) {
  return fieldRequest<T>(path, { token: parseCookies().token }, options);
}
