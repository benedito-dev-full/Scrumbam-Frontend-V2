import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ─── Helpers de rota ──────────────────────────────────────────────────────────

/**
 * Retorna true se o pathname pertence às rotas de autenticação.
 */
function isAuthRoute(pathname: string): boolean {
  return pathname === "/login" || pathname === "/register";
}

/**
 * Retorna true se o pathname pertence ao app protegido.
 * Exclui rotas de auth, _next, api e favicon.ico.
 */
function isAppRoute(pathname: string): boolean {
  if (isAuthRoute(pathname)) return false;
  if (pathname.startsWith("/_next")) return false;
  if (pathname.startsWith("/api")) return false;
  if (pathname === "/favicon.ico") return false;
  return true;
}

// ─── Proxy ────────────────────────────────────────────────────────────────────

/**
 * Proteção de rotas via cookie `scrumbam_auth`.
 *
 * Regras:
 * - Rota de auth + autenticado → redirect para /
 * - Rota do app + não autenticado → redirect para /login
 * - Demais casos → continua normalmente
 *
 * O cookie é setado por `useAuthStore.setTokens()` no cliente
 * e removido por `useAuthStore.clearSession()`.
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const isAuthenticated = request.cookies.has("scrumbam_auth");

  // Regra A: usuário autenticado tentando acessar rota de auth → redireciona para /
  if (isAuthRoute(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Regra B: usuário não autenticado tentando acessar rota protegida → redireciona para /login
  if (isAppRoute(pathname) && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// ─── Matcher ──────────────────────────────────────────────────────────────────

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
