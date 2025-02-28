import { NextResponse } from "next/server";
import { parseCookies, setCookie } from "nookies";
import type { NextRequest } from "next/server";
import { jwtDecode } from "jwt-decode";
import { DecodedToken } from "./types/auth";

export function middleware(req: NextRequest) {
  const cookies = parseCookies({
    req: {
      headers: {
        cookie: req.headers.get("cookie"),
      },
    },
  });

  const token = cookies.token;
  const isAuthRoute = req.nextUrl.pathname.startsWith("/login");
  console.log("Rota autenticada?", isAuthRoute);
  //   const isProtectedRoute = req.nextUrl.pathname.startsWith("/dashboard");

  if (isAuthRoute) {
    console.log("Rota autenticada, continuando navegação");
    return NextResponse.next();
  }

  if (!token) {
    console.log("Token não encontrado, redirecionando para login");
    return NextResponse.redirect(new URL("/login", req.url));
  }

  console.log("Token encontrado, continuando navegação");

  const decoded = jwtDecode<DecodedToken>(token);
  console.log(`[middleware] Usuário autenticado: ${decoded.userName} - Roles: ${decoded.roles} - Tenant: ${decoded.tenantId}`);
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/gestao/:path*"], // Ajuste as rotas protegidas
};
