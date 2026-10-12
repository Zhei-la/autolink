import { NextResponse, type NextRequest } from 'next/server';

/**
 * 1) 짧은 공개 주소: NEXT_PUBLIC_PUBLIC_HOST 로 들어온 /아이디 → /p/아이디
 * 2) 편집 화면은 By링크 쿠키가 없으면 /login → 바이란미디어 로그인으로
 *    (쿠키가 진짜인지는 각 화면에서 서버가 다시 확인)
 */
const PUBLIC_HOST = (process.env.NEXT_PUBLIC_PUBLIC_HOST || '').toLowerCase();
const RESERVED = new Set([
  'p', 'api', 'admin', 'login', 'logout', 'dashboard', 'edit', 'auth', 'stats', 'img',
  '_next', 'favicon.ico', 'robots.txt', 'sitemap.xml',
]);
const PROTECTED = ['/dashboard', '/edit', '/admin'];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (PUBLIC_HOST) {
    const host = (request.headers.get('host') || '').toLowerCase().split(':')[0];
    if (host === PUBLIC_HOST) {
      const m = path.match(/^\/([a-z0-9_.-]{3,30})\/?$/i);
      if (m && !RESERVED.has(m[1].toLowerCase())) {
        const url = request.nextUrl.clone();
        url.pathname = `/p/${m[1].toLowerCase()}`;
        return NextResponse.rewrite(url);
      }
    }
  }

  if (PROTECTED.some((p) => path === p || path.startsWith(p + '/')) && !request.cookies.get('bl_sess')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|img/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2)$).*)'],
};
