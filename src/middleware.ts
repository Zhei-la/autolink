import { NextResponse, type NextRequest } from 'next/server';

/**
 * 1) 짧은 공개 주소: NEXT_PUBLIC_PUBLIC_HOST 로 들어온 /아이디 → /p/아이디
 * 2) 편집 화면은 By링크 쿠키가 없으면 /login → 바이란미디어 로그인으로
 *    (쿠키가 진짜인지는 각 화면에서 서버가 다시 확인)
 */
const PUBLIC_HOST = (process.env.NEXT_PUBLIC_PUBLIC_HOST || '').toLowerCase();
const RESERVED = new Set([
  'p', 'go', 'api', 'admin', 'login', 'logout', 'dashboard', 'edit', 'auth', 'stats', 'img',
  '_next', 'favicon.ico', 'robots.txt', 'sitemap.xml',
]);
const PROTECTED = ['/dashboard', '/edit', '/admin'];

const BASE = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '');
const CANONICAL = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname; // basePath(/bylink) 는 빠진 값

  // Railway 기본 주소로 직접 들어오면 정식 주소(byranmedia.com/bylink)로
  const reqHost = (request.headers.get('host') || '').toLowerCase();
  if (CANONICAL && reqHost.endsWith('.up.railway.app')) {
    return NextResponse.redirect(`${CANONICAL}${BASE}${path}${request.nextUrl.search}`, 308);
  }

  // 하위 경로 모드: byranmedia.com/bylink/아이디 → 공개 페이지
  if (BASE) {
    const m = path.match(/^\/([a-z0-9_.-]{3,30})\/?$/i);
    if (m && !RESERVED.has(m[1].toLowerCase())) {
      const url = request.nextUrl.clone();
      url.pathname = `/p/${m[1].toLowerCase()}`;
      return NextResponse.rewrite(url);
    }
  }

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
    // 프록시 뒤에 있으므로 주소는 실제로 들어온 호스트 기준으로 만든다
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.host;
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    const to = new URL(`${BASE}/login?next=${encodeURIComponent(path + request.nextUrl.search)}`, `${proto}://${host}`);
    return NextResponse.redirect(to);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|img/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2)$).*)'],
};
