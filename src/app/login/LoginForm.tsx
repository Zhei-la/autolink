'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/dashboard';

  const supabase = createClient();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // 구글 OAuth 로그인
  async function handleGoogleLogin() {
    setLoading(true);
    setError(null);
    const siteUrl =
      typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // 성공 시 리다이렉트 (브라우저가 알아서)
  }

  // 이메일 로그인
  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(getErrorMessage(error.message));
        setLoading(false);
        return;
      }
      router.push(next);
      router.refresh();
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) {
        setError(getErrorMessage(error.message));
        setLoading(false);
        return;
      }
      setInfo('가입 확인 메일을 보냈어요. 이메일 확인 후 로그인해주세요.');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="h-2 bg-primary" />

      <div className="mx-auto max-w-md px-6 py-12">
        {/* 로고 */}
        <Link href="/" className="inline-flex items-center gap-2 mb-12">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-black text-xl">A</span>
          </div>
          <div className="text-xl font-black">
            <span className="text-text">auto</span>
            <span className="text-primary">link</span>
          </div>
        </Link>

        <h1 className="text-3xl font-black mb-2">
          {mode === 'signin' ? '다시 만나서 반가워요' : '오토링크 시작하기'}
        </h1>
        <p className="text-text-2 mb-8">
          {mode === 'signin'
            ? '로그인하고 내 페이지를 관리하세요'
            : '5분이면 첫 페이지가 만들어져요'}
        </p>

        {/* 구글 로그인 */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full h-14 flex items-center justify-center gap-3 border border-border rounded-xl hover:bg-primary-soft transition font-bold disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          구글로 계속하기
        </button>

        {/* 구분선 */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-sm text-text-3">또는</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* 이메일 폼 */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <Input
            type="email"
            label="이메일"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={loading}
          />
          <Input
            type="password"
            label="비밀번호"
            placeholder={mode === 'signup' ? '6자 이상' : ''}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            disabled={loading}
          />

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
          {info && (
            <div className="p-3 bg-primary-soft border border-primary rounded-lg text-sm text-primary-dark">
              {info}
            </div>
          )}

          <Button type="submit" size="lg" loading={loading} className="w-full">
            {mode === 'signin' ? '로그인' : '가입하기'}
          </Button>
        </form>

        {/* 모드 전환 */}
        <p className="text-center mt-6 text-sm text-text-2">
          {mode === 'signin' ? '아직 계정이 없나요?' : '이미 계정이 있나요?'}{' '}
          <button
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError(null);
              setInfo(null);
            }}
            className="font-bold text-primary hover:underline"
          >
            {mode === 'signin' ? '가입하기' : '로그인'}
          </button>
        </p>

        {/* 약관 (간단) */}
        {mode === 'signup' && (
          <p className="text-xs text-text-3 text-center mt-4 leading-relaxed">
            가입 시 서비스 이용약관과 개인정보 처리방침에 동의하게 됩니다.
          </p>
        )}
      </div>
    </main>
  );
}

function getErrorMessage(rawMessage: string): string {
  if (rawMessage.includes('Invalid login credentials')) {
    return '이메일 또는 비밀번호가 맞지 않아요.';
  }
  if (rawMessage.includes('User already registered')) {
    return '이미 가입된 이메일이에요. 로그인해주세요.';
  }
  if (rawMessage.includes('Password should be')) {
    return '비밀번호는 6자 이상이어야 해요.';
  }
  if (rawMessage.includes('Email not confirmed')) {
    return '이메일 인증이 아직 안 됐어요. 메일함을 확인해주세요.';
  }
  return rawMessage;
}
