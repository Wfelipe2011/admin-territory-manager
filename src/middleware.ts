import { NextResponse } from "next/server";
import { parseCookies } from "nookies";
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

  if (isAuthRoute) {
    console.log("Rota autenticada, continuando navegação");
    return NextResponse.next();
  }

  if (!token) {
    console.log("Token não encontrado, redirecionando para login");
    return NextResponse.redirect(new URL("/login?error=missing", req.url));
  }

  try {
    const decoded = jwtDecode<DecodedToken>(token);
    const currentTime = Math.floor(Date.now() / 1000);

    if (decoded.exp && decoded.exp < currentTime) {
      console.log("Token expirado, redirecionando para login");
      return NextResponse.redirect(new URL("/login?error=expired", req.url));
    }

    console.log(`[middleware] Usuário autenticado: ${decoded.userName} - Roles: ${decoded.roles} - Tenant: ${decoded.tenantId}`);
    return NextResponse.next();
  } catch (error) {
    console.log("Erro ao decodificar o token, redirecionando para login");
    return NextResponse.redirect(new URL("/login?error=invalid", req.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/gestao/:path*", "/cadastro/:path*", "/territories/:path*"],
};
