import { NextResponse } from 'next/server';
import { OWNER_COOKIE, ownerCookieOptions, verify } from '@/lib/server/auth';

/**
 * 짧은 도메인(bylink.me)에도 "이 기기 주인" 표시를 심는 곳.
 * 로그인 직후 한 번 들렀다가 원래 화면(바이란미디어)으로 돌아간다.
 * → 주인이 bylink.me/아이디 로 자기 페이지를 열어도 방문·클릭으로 세지 않음
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('t');
  const site = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
  const nextRaw = url.searchParams.get('next') || '';
  const next = site && nextRaw.startsWith(site + '/') ? nextRaw : `${site || ''}${process.env.NEXT_PUBLIC_BASE_PATH || ''}/dashboard`;

  const res = NextResponse.redirect(next, { status: 302 });
  const data = verify<{ uid: number; me?: number }>(token);
  if (data?.uid && data.me === 1 && token) res.cookies.set(OWNER_COOKIE, token, ownerCookieOptions);
  return res;
}
