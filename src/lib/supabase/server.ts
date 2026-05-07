import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * 서버 컴포넌트, Server Action, Route Handler에서 사용하는 Supabase 클라이언트.
 * 쿠키를 읽고 쓸 수 있어 인증 세션 유지에 사용.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component 안에서 호출되면 setAll이 실패할 수 있음 — 무시.
            // 미들웨어가 세션을 갱신해주므로 문제 없음.
          }
        },
      },
    }
  );
}
