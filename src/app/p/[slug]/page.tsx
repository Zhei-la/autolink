import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PublicPageClient } from '@/components/blocks/PublicPageClient';
import { ViewTracker } from '@/components/blocks/ViewTracker';
import type { Block } from '@/types';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = createClient();
  const { data: page } = await supabase
    .from('pages')
    .select('title, slug')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .maybeSingle();

  if (!page) return { title: '페이지를 찾을 수 없음' };

  return {
    title: page.title,
    description: `${page.title}의 링크 페이지`,
    openGraph: {
      title: page.title,
      description: `${page.title}의 링크 페이지`,
      type: 'profile',
    },
  };
}

export default async function PublicPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .maybeSingle();

  if (!page) notFound();

  // 활성화된 블록만 가져옴
  const { data: blocks } = await supabase
    .from('blocks')
    .select('*')
    .eq('page_id', page.id)
    .eq('is_active', true)
    .order('position', { ascending: true });

  // 방문 기록은 클라이언트(ViewTracker)가 /api/view 로 보냄
  // → 봇 제외, referrer/UTM/디바이스 수집, 새로고침 중복 방지

  const theme = page.theme || {};
  const primaryColor = theme.primaryColor || '#f97316';
  const bgColor = theme.bgColor || '#fafafa';

  return (
    <main className="min-h-screen" style={{ backgroundColor: bgColor }}>
      <ViewTracker pageId={page.id} />
      <div className="mx-auto max-w-md px-4 py-8">
        <PublicPageClient
          blocks={(blocks || []) as Block[]}
          primaryColor={primaryColor}
        />

        {/* 푸터 */}
        <div className="text-center mt-12 pt-6 border-t border-text-3/20">
          <a
            href="/"
            className="inline-flex items-center gap-1 text-xs text-text-3 hover:text-primary"
          >
            <span>made with</span>
            <span className="font-bold">
              <span className="text-text-2">auto</span>
              <span style={{ color: primaryColor }}>link</span>
            </span>
          </a>
        </div>
      </div>
    </main>
  );
}
