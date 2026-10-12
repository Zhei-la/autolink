import { NextResponse } from 'next/server';
import { SESSION_COOKIE, loungeUrl } from '@/lib/server/auth';

/** By링크에서만 나가기 → 바이란미디어로 돌아감 */
export async function POST() {
  const res = NextResponse.redirect(`${loungeUrl()}/bylink`, { status: 303 });
  res.cookies.set(SESSION_COOKIE, '', { path: process.env.NEXT_PUBLIC_BASE_PATH || '/', maxAge: 0 });
  return res;
}

export async function GET() {
  return POST();
}
