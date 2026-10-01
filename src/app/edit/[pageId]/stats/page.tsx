import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getMyAccount } from '@/lib/db/account';
import { StatsView, type StatsData } from '@/components/stats/StatsView';
import { blockMeta, blockSummary } from '@/components/editor/blockTypes';
import {
  INAPP_LABEL,
  SOURCE_LABEL,
  classifyHost,
  deviceFromUA,
  fetchAllRows,
  hostOf,
  kstDay,
  resolveRange,
} from '@/lib/analytics';

export const dynamic = 'force-dynamic';

const CLICKABLE = new Set(['link', 'link_collection', 'image_banner', 'product_grid', 'sns']);

export default async function StatsPage({
  params,
  searchParams,
}: {
  params: { pageId: string };
  searchParams: { range?: string; from?: string; to?: string };
}) {
  const supabase = createClient();
  const { user } = await getMyAccount();
  if (!user) notFound();

  const { data: page } = await supabase
    .from('pages')
    .select('id, slug, view_count, created_at')
    .eq('id', params.pageId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!page) notFound();

  const range = resolveRange(searchParams.range, searchParams.from, searchParams.to, page.created_at);
  const startIso = new Date(range.startMs).toISOString();
  const endIso = new Date(range.endMs).toISOString();

  const [{ data: blocks }, viewsRes, clicksRes] = await Promise.all([
    supabase.from('blocks').select('id, type, data, position').eq('page_id', page.id).order('position'),
    // 방문 상세 (마이그레이션 001 의 page_views). 없으면 error → 클릭만으로 표시
    fetchAllRows(supabase as any, 'page_views', 'viewed_at, visitor_hash, referrer, referrer_source, device_type, inapp_app', (q) =>
      q.eq('page_id', page.id).gte('viewed_at', startIso).lte('viewed_at', endIso).order('viewed_at').order('id')
    ),
    // 클릭 (기본 스키마에 있음). 001 이전 DB 에도 있는 컬럼만 고르기 위해 * 사용
    fetchAllRows(supabase as any, 'click_events', '*', (q) =>
      q.eq('page_id', page.id).gte('created_at', startIso).lte('created_at', endIso).order('created_at').order('id')
    ),
  ]);

  const viewsAvailable = !viewsRes.error;
  const views = viewsRes.rows;
  const clicks = clicksRes.rows;

  // 일별
  const byDay = new Map(range.days.map((d) => [d, { day: d, views: 0, clicks: 0 }]));
  views.forEach((v) => {
    const r = byDay.get(kstDay(v.viewed_at));
    if (r) r.views++;
  });
  clicks.forEach((c) => {
    const r = byDay.get(kstDay(c.created_at));
    if (r) r.clicks++;
  });

  // 블록별 클릭
  const clickCount = new Map<string, number>();
  clicks.forEach((c) => clickCount.set(c.block_id, (clickCount.get(c.block_id) || 0) + 1));
  const blockRows = (blocks || [])
    .filter((b) => CLICKABLE.has(b.type) || clickCount.has(b.id))
    .map((b) => {
      const meta = blockMeta(b.type);
      const summary = blockSummary(b as any);
      return {
        id: b.id,
        type: b.type,
        label: summary ? `${meta.label} · ${summary}` : meta.label,
        clicks: clickCount.get(b.id) || 0,
      };
    });

  // 유입 채널: 리퍼러 도메인 기준
  const channels = new Map<string, { key: string; label: string; host: string | null; views: number; visitors: Set<string>; clicks: number }>();
  const channelOf = (referrer: string | null | undefined, source?: string | null) => {
    const host = hostOf(referrer);
    const src = host ? classifyHost(host) : source && source !== 'other' ? source : 'direct';
    const key = host || src;
    if (!channels.has(key)) {
      channels.set(key, { key, label: SOURCE_LABEL[src] || src, host, views: 0, visitors: new Set(), clicks: 0 });
    }
    return channels.get(key)!;
  };
  views.forEach((v) => {
    const ch = channelOf(v.referrer, v.referrer_source);
    ch.views++;
    if (v.visitor_hash) ch.visitors.add(v.visitor_hash);
  });
  clicks.forEach((c) => {
    channelOf(c.referrer, c.referrer_source).clicks++;
  });

  // 기기
  const devices = { mobile: 0, pc: 0 };
  const inapp = new Map<string, number>();
  views.forEach((v) => {
    const d = v.device_type === 'pc' ? 'pc' : 'mobile';
    devices[d]++;
    if (v.inapp_app) inapp.set(v.inapp_app, (inapp.get(v.inapp_app) || 0) + 1);
  });
  if (!viewsAvailable) {
    clicks.forEach((c) => devices[deviceFromUA(c.user_agent)]++);
  }

  const visitors = new Set(views.map((v) => v.visitor_hash).filter(Boolean)).size;

  const data: StatsData = {
    range: range.key,
    from: range.days[0],
    to: range.days[range.days.length - 1],
    views: viewsAvailable ? views.length : range.key === 'all' ? page.view_count || 0 : 0,
    visitors,
    clicks: clicks.length,
    daily: Array.from(byDay.values()),
    blocks: blockRows,
    channels: Array.from(channels.values())
      .map((c) => ({ key: c.key, label: c.label, host: c.host, views: c.views, visitors: c.visitors.size, clicks: c.clicks }))
      .sort((a, b) => b.views - a.views || b.clicks - a.clicks),
    devices,
    inapp: Array.from(inapp.entries())
      .map(([key, count]) => ({ key, label: INAPP_LABEL[key] || key, count }))
      .sort((a, b) => b.count - a.count),
    viewsAvailable,
    slug: page.slug,
  };

  return (
    <main className="mx-auto max-w-[560px] px-4 pt-1">
      <StatsView data={data} />
    </main>
  );
}
