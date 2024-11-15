import { NextResponse } from "next/server";
import { parseCookies } from "nookies";
import type { NextRequest } from "next/server";

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
  //   const isProtectedRoute = req.nextUrl.pathname.startsWith("/dashboard");

  if (isAuthRoute) {
    return NextResponse.next();
  }

  if (!token) {
    console.log("No token found");
    return NextResponse.redirect(new URL("/login", req.url));
  }

  console.log("Token found, continuing navigation");

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/gestao/:path*"], // Ajuste as rotas protegidas
};
