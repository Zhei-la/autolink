import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PageView } from '@/components/page/PageView';
import { ViewTracker } from '@/components/blocks/ViewTracker';
import type { Block } from '@/types';
import type { Metadata, Viewport } from 'next';
import { isScheduledVisible, resolveTheme } from '@/lib/theme';

export const dynamic = 'force-dynamic';

async function loadPage(slug: string) {
  const supabase = createClient();
  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', decodeURIComponent(slug).toLowerCase())
    .eq('is_published', true)
    .maybeSingle();
  if (!page) return { supabase, page: null, blocks: [] as Block[] };

  const { data: blocks } = await supabase
    .from('blocks')
    .select('*')
    .eq('page_id', page.id)
    .eq('is_active', true)
    .order('position', { ascending: true });

  // 예약 공개: 기간 밖의 블록은 서버에서 빼고 보냄 (페이지 소스에도 안 나오게)
  const now = Date.now();
  const visible = ((blocks || []) as Block[]).filter((b) => isScheduledVisible(b.data, now));
  return { supabase, page, blocks: visible };
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { page, blocks } = await loadPage(params.slug);
  if (!page) return { title: '페이지를 찾을 수 없음' };

  const profile = blocks.find((b) => b.type === 'profile');
  const title = profile?.data?.name || page.title;
  const description = profile?.data?.bio || `${page.title}의 링크 페이지`;
  const image = profile?.data?.avatarUrl;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      ...(image ? { images: [{ url: image }] } : {}),
    },
  };
}

export async function generateViewport({ params }: { params: { slug: string } }): Promise<Viewport> {
  const { page } = await loadPage(params.slug);
  return {
    width: 'device-width',
    initialScale: 1,
    themeColor: page ? resolveTheme(page.theme).bgColor : '#ffffff',
  };
}

export default async function PublicPage({ params }: { params: { slug: string } }) {
  const { page, blocks } = await loadPage(params.slug);
  if (!page) notFound();

  // 방문 기록은 클라이언트(ViewTracker)가 /api/view 로 보냄
  // → 봇 제외, referrer/UTM/디바이스 수집, 새로고침 중복 방지
  return (
    <main>
      <ViewTracker pageId={page.id} />
      <PageView page={page} blocks={blocks} isPublic />
    </main>
  );
}
