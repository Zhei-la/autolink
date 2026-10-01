import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getMyAccount, STATUS_MESSAGE } from '@/lib/db/account';
import { NewPageForm } from './NewPageForm';

export default async function NewPagePage() {
  const { user, profile, effectiveStatus } = await getMyAccount();
  if (!user) redirect('/login?next=/dashboard/new');

  const supabase = createClient();
  const { count } = await supabase
    .from('pages')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const limit = profile?.page_limit ?? 3;
  const remaining = Math.max(0, limit - (count ?? 0));

  return (
    <main className="min-h-screen bg-white">

      <header className="border-b border-border">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-text-2 hover:text-text">
            <ChevronLeft className="w-4 h-4" /> 대시보드
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-3xl font-black mb-2">새 페이지 만들기</h1>
        <p className="text-text-2 mb-8">
          기본 정보만 입력하면 바로 만들어져요. 나중에 편집기에서 자유롭게 수정할 수 있어요.
        </p>

        {effectiveStatus !== 'active' ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {STATUS_MESSAGE[effectiveStatus]}
          </div>
        ) : (
          <NewPageForm remaining={remaining} />
        )}
      </div>
    </main>
  );
}
