import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * 서비스 롤 클라이언트 — RLS를 우회한다. 서버(Route Handler, Server Action)에서만 사용.
 * 절대 클라이언트 컴포넌트에서 import 하지 말 것.
 *
 * 사용처: /api/remix-push (외부 자동화 프로그램이 secret으로 호출 → 로그인 세션 없음)
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다');
  }
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
