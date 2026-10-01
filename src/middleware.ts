import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * 짧은 공개 주소: NEXT_PUBLIC_PUBLIC_HOST(예: link.byranmedia.com)로 들어온 요청은
 *   link.byranmedia.com/daegeon_dnc  →  /p/daegeon_dnc  로 내부 연결(rewrite).
 * 그 외 호스트(Railway 기본 주소 등)는 지금처럼 /p/<아이디> 그대로.
 */
const PUBLIC_HOST = (process.env.NEXT_PUBLIC_PUBLIC_HOST || '').toLowerCase();
const RESERVED = new Set([
  'p', 'api', 'admin', 'login', 'logout', 'dashboard', 'edit', 'auth', 'stats',
  '_next', 'favicon.ico', 'robots.txt', 'sitemap.xml',
]);

export async function middleware(request: NextRequest) {
  if (PUBLIC_HOST) {
    const host = (request.headers.get('host') || '').toLowerCase().split(':')[0];
    if (host === PUBLIC_HOST) {
      const path = request.nextUrl.pathname;
      const m = path.match(/^\/([a-z0-9_.-]{3,30})\/?$/i);
      if (m && !RESERVED.has(m[1].toLowerCase())) {
        const url = request.nextUrl.clone();
        url.pathname = `/p/${m[1].toLowerCase()}`;
        return NextResponse.rewrite(url);
      }
    }
  }
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * 다음을 제외한 모든 경로 매칭:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon, 이미지/폰트 파일
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2)$).*)',
  ],
};
