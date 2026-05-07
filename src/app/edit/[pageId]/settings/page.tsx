import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, BarChart3 } from 'lucide-react';
import { PageSettingsForm } from '@/components/editor/PageSettingsForm';

export default async function SettingsPage({ params }: { params: { pageId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('id', params.pageId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!page) notFound();

  return (
    <main className="min-h-screen bg-white pb-20">
      <div className="h-2 bg-primary" />

      <header className="border-b border-border">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center justify-between">
          <Link href={`/edit/${page.id}`} className="inline-flex items-center gap-1 text-sm text-text-2 hover:text-text">
            <ChevronLeft className="w-4 h-4" /> 편집기로
          </Link>
          <div className="font-bold text-sm">설정</div>
          <Link
            href={`/edit/${page.id}/stats`}
            className="inline-flex items-center gap-1 text-sm text-text-2 hover:text-text"
          >
            <BarChart3 className="w-4 h-4" /> 통계
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6">
        <PageSettingsForm page={page} />
      </div>
    </main>
  );
}
