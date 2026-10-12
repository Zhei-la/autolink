import { NextResponse } from 'next/server';
import { OWNER_COOKIE, SESSION_COOKIE, ownerCookieOptions, ownerCookieValue, sessionCookieOptions, sessionCookieValue, verify, loungeUrl } from '@/lib/server/auth';
import { ensureAccount } from '@/lib/db/account';
import { one } from '@/lib/server/db';

/**
 * 바이란미디어(라운지)에서 넘어오는 입구.
 * 라운지가 만든 서명 토큰(5분 유효)을 확인하고 By링크 쿠키를 심은 뒤 원래 가려던 곳으로 보낸다.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('t');
  const nextRaw = url.searchParams.get('next') || '/dashboard';
  const next = nextRaw.startsWith('/') && !nextRaw.startsWith('//') ? nextRaw : '/dashboard';

  const data = verify<{ uid: number; aud?: string }>(token);
  if (!data?.uid || data.aud !== 'bylink') {
    return NextResponse.redirect(`${loungeUrl()}/bylink?err=login`, { status: 302 });
  }

  const user = await one(`SELECT id, status FROM users WHERE id = $1`, [data.uid]);
  if (!user || user.status === 'suspended') {
    return NextResponse.redirect(`${loungeUrl()}/bylink?err=login`, { status: 302 });
  }
  await ensureAccount(user.id);

  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || url.origin;
  const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const target = `${base}${BASE}${next}`;
  const owner = ownerCookieValue(user.id);
  // 짧은 도메인(bylink.me)이 연결돼 있으면 거기에도 "주인 기기" 표시를 심고 돌아옴
  const markHost = (process.env.BYLINK_MARK_HOST || '').trim();
  const res = NextResponse.redirect(
    markHost ? `https://${markHost}${BASE}/auth/mark?t=${encodeURIComponent(owner)}&next=${encodeURIComponent(target)}` : target,
    { status: 302 }
  );
  res.cookies.set(SESSION_COOKIE, sessionCookieValue(user.id), sessionCookieOptions);
  res.cookies.set(OWNER_COOKIE, owner, ownerCookieOptions);
  return res;
}
