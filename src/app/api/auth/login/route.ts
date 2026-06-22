import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'hdh-operator-session';
const COOKIE_MAX_AGE = 8 * 60 * 60; // 8 ore in secondi

export async function POST(request: NextRequest) {
  const password = process.env.OPERATOR_PASSWORD;

  if (!password) {
    return NextResponse.json(
      { error: 'OPERATOR_PASSWORD non configurata. Controlla .env.local' },
      { status: 503 }
    );
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }

  if (!body.password) {
    return NextResponse.json({ error: 'Password obbligatoria' }, { status: 400 });
  }

  // Confronto plain text (KAN-30: sufficiente per LAN single-operator)
  if (body.password !== password) {
    return NextResponse.json({ error: 'Password errata' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, 'authenticated', {
    httpOnly: true,
    maxAge: COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'strict',
  });

  return response;
}
