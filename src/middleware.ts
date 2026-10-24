import { NextResponse, type NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';
import { DecodedToken } from './types/auth';

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (req.nextUrl.hostname === 'app.territory-manager.com.br') {
    return NextResponse.redirect(new URL(path + req.nextUrl.search, process.env.NEXT_PUBLIC_APP_URL || 'https://admin.territory-manager.com.br'), 308);
  }
  // Field authorization is performed by the API using its independent session.
  if (path === '/' || path === '/home' || path.startsWith('/acesso/') || path.startsWith('/campo/')) return NextResponse.next();
  const token = req.cookies.get('token')?.value;
  if (!token) return NextResponse.redirect(new URL('/login?error=missing', req.url));
  try {
    const user = jwtDecode<DecodedToken>(token);
    if (!user.exp || user.exp <= Date.now() / 1000) return NextResponse.redirect(new URL('/login?error=expired', req.url));
    if (!user.roles?.some(role => ['admin', 'super_admin'].includes(role))) return NextResponse.redirect(new URL('/login?error=forbidden', req.url));
    return NextResponse.next();
  } catch { return NextResponse.redirect(new URL('/login?error=invalid', req.url)); }
}

export const config = {
  matcher: ['/', '/home', '/acesso/:path*', '/campo/:path*', '/dashboard/:path*', '/gestao/:path*', '/cadastro/:path*', '/territories/:path*', '/balanco/:path*'],
};
