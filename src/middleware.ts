import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard') ||
                      request.nextUrl.pathname === '/';

  // Se está tentando acessar dashboard sem token
  if (isDashboard && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Se está logado e tenta acessar login
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
