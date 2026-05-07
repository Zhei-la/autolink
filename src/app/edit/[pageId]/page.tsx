import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ExternalLink, Copy } from 'lucide-react';
import { BlockList } from '@/components/editor/BlockList';
import type { Block } from '@/types';

export default async function EditPage({ params }: { params: { pageId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // 페이지 정보
  const { data: page, error: pageErr } = await supabase
    .from('pages')
    .select('*')
    .eq('id', params.pageId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (pageErr || !page) notFound();

  // 블록들 (position 순서)
  const { data: blocks } = await supabase
    .from('blocks')
    .select('*')
    .eq('page_id', page.id)
    .order('position', { ascending: true });

  return (
    <main className="min-h-screen bg-white pb-20">
      <div className="h-2 bg-primary" />

      <header className="border-b border-border sticky top-0 bg-white z-30">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between gap-2">
          <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-text-2 hover:text-text">
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">대시보드</span>
          </Link>

          <div className="flex-1 min-w-0 text-center">
            <div className="font-bold text-sm truncate">{page.title}</div>
            <div className="text-xs text-text-3 truncate">/p/{page.slug}</div>
          </div>

          <a
            href={`/p/${page.slug}`}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1 h-9 px-3 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-dark transition"
          >
            <ExternalLink className="w-3.5 h-3.5" /> 보기
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* 안내 박스 */}
        <div className="mb-6 p-4 bg-primary-soft border border-primary border-l-4 rounded-xl">
          <p className="text-sm text-text">
            <strong>편집 모드</strong> · 블록을 추가하거나 수정하세요. 변경사항은 저장 즉시 반영돼요.
          </p>
        </div>

        <BlockList
          pageId={page.id}
          blocks={(blocks || []) as Block[]}
          primaryColor={page.theme?.primaryColor || '#f97316'}
        />

        {/* 페이지 설정 */}
        <div className="mt-12 pt-6 border-t border-border space-y-2">
          <h2 className="font-bold mb-4">페이지 관리</h2>
          <Link
            href={`/edit/${page.id}/stats`}
            className="block p-4 border border-border rounded-xl hover:border-primary transition"
          >
            <div className="font-bold text-sm">📊 통계 보기</div>
            <div className="text-xs text-text-3 mt-1">방문수·클릭수·이메일·문의 모두 한눈에</div>
          </Link>
          <Link
            href={`/edit/${page.id}/settings`}
            className="block p-4 border border-border rounded-xl hover:border-primary transition"
          >
            <div className="font-bold text-sm">⚙️ 설정</div>
            <div className="text-xs text-text-3 mt-1">제목, URL, 색상, 공개·비공개</div>
          </Link>
        </div>
      </div>
    </main>
  );
}
