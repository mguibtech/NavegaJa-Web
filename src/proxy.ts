import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Rotas públicas que não precisam de autenticação
  const publicPaths = ['/login', '/track'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // Rotas protegidas que precisam de autenticação
  const protectedPaths = ['/dashboard'];
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path)) || pathname === '/';

  // Se está tentando acessar rota protegida sem token
  if (isProtectedPath && !token) {
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }

  // Se está logado e tenta acessar página de login ou root
  if ((isPublicPath || pathname === '/') && token) {
    const url = new URL('/dashboard', request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
