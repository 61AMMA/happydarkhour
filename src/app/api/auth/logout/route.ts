import { NextResponse } from 'next/server';

const COOKIE_NAME = 'hdh-operator-session';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
    sameSite: 'strict',
  });
  return response;
}
