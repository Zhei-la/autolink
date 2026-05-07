import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * OAuth 로그인 후 또는 이메일 가입 확인 후 리다이렉트되는 곳.
 * code → session 교환 후, next 파라미터의 페이지로 보냄.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error('OAuth 콜백 에러:', error.message);
  }

  // 에러 시 로그인 페이지로 돌려보냄
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
