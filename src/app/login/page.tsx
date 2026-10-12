import { redirect } from 'next/navigation';
import { loginUrl } from '@/lib/server/auth';

/** By링크는 따로 로그인하지 않아요 — 바이란미디어 로그인으로 보냄 */
export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  redirect(loginUrl(searchParams?.next || '/dashboard'));
}
