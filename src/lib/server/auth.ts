import 'server-only';
import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { one } from './db';

/**
 * 바이란미디어 회원으로 By링크 쓰기 (별도 로그인 화면 없음)
 *
 * 1) 라운지(byranmedia.com)의 /bylink/go 가 로그인한 회원에게 짧게 유효한 서명 토큰을 만들어
 *    By링크 /auth/lounge?t=... 로 보낸다. (두 서버가 같은 BYLINK_SSO_SECRET 을 가짐)
 * 2) By링크가 토큰을 확인하고 자기 쿠키(bl_sess)를 심는다.
 * 3) 이후 요청마다 쿠키 → 라운지 users 표에서 회원을 다시 읽는다 (정지되면 바로 막힘).
 */

export const SESSION_COOKIE = 'bl_sess';
const SESSION_DAYS = 30;

function secret(): string {
  const s = process.env.BYLINK_SSO_SECRET;
  if (!s || s.length < 16) throw new Error('BYLINK_SSO_SECRET 환경변수가 없어요');
  return s;
}

const b64 = (buf: Buffer | string) => Buffer.from(buf).toString('base64url');

export function sign(payload: Record<string, any>): string {
  const body = b64(JSON.stringify(payload));
  const sig = b64(createHmac('sha256', secret()).update(body).digest());
  return `${body}.${sig}`;
}

export function verify<T = any>(token: string | undefined | null): T | null {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  let expected: Buffer;
  try {
    expected = createHmac('sha256', secret()).update(body).digest();
  } catch {
    return null;
  }
  const given = Buffer.from(sig || '', 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (typeof data.exp !== 'number' || Date.now() / 1000 > data.exp) return null;
    return data as T;
  } catch {
    return null;
  }
}

/** 라운지 주소 (로그인·로그아웃이 일어나는 곳) */
export function loungeUrl(): string {
  return (process.env.LOUNGE_URL || 'https://byranmedia.com').replace(/\/$/, '');
}

/** 로그인이 필요할 때 보낼 곳: 라운지가 로그인시킨 뒤 다시 By링크로 돌려보냄 */
export function loginUrl(next = '/dashboard'): string {
  const safe = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
  return `${loungeUrl()}/bylink/go?next=${encodeURIComponent(safe)}`;
}

export function sessionCookieValue(uid: number): string {
  return sign({ uid, exp: Math.floor(Date.now() / 1000) + SESSION_DAYS * 86400 });
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_DAYS * 86400,
};

export interface SessionUser {
  id: number;
  name: string;
  email: string | null;
  avatarId: number | null;
  isAdmin: boolean;
  loungeStatus: string;
}

/** 지금 로그인한 회원 (없으면 null) */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const data = verify<{ uid: number }>(token);
  if (!data?.uid) return null;
  const u = await one(
    `SELECT id, email, name, nickname, role, status, avatar_id FROM users WHERE id = $1`,
    [data.uid]
  );
  if (!u) return null;
  if (u.status === 'suspended') return null;
  return {
    id: u.id,
    name: u.nickname || u.name || '회원',
    email: u.email && !String(u.email).endsWith('.local') ? u.email : null,
    avatarId: u.avatar_id ?? null,
    isAdmin: u.role === 'admin',
    loungeStatus: u.status,
  };
}
