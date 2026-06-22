import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'hdh-operator-session';
const LOGIN_PATH = '/operator/login';

// Verifica al boot che OPERATOR_PASSWORD sia configurata
// (errore loggato una volta sola alla prima richiesta intercettata)
let passwordWarned = false;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protegge /operator/* e /creator/* (escluso /operator/login)
  const isProtected =
    pathname.startsWith('/operator') || pathname.startsWith('/creator');
  if (!isProtected || pathname.startsWith(LOGIN_PATH)) {
    return NextResponse.next();
  }

  const password = process.env.OPERATOR_PASSWORD;
  if (!password && !passwordWarned) {
    passwordWarned = true;
    console.error(
      '[HDH] OPERATOR_PASSWORD non impostata in .env.local — accesso operatore bloccato.'
    );
  }

  const sessionCookie = request.cookies.get(COOKIE_NAME);
  if (!sessionCookie || sessionCookie.value !== 'authenticated') {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/operator/:path*', '/creator/:path*'],
};
