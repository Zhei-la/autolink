import { redirect } from 'next/navigation';
import { getSessionUser, loungeUrl } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

/** By링크 첫 화면: 로그인돼 있으면 내 페이지 목록, 아니면 바이란미디어의 By링크 소개로 */
export default async function HomePage() {
  const user = await getSessionUser().catch(() => null);
  if (user) redirect('/dashboard');
  redirect(`${loungeUrl()}/bylink`);
}
