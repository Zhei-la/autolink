import { notFound } from 'next/navigation';
import { getMyPage, plain } from '@/lib/server/data';
import { q } from '@/lib/server/db';
import { getMyAccount } from '@/lib/db/account';
import { StatsView, type StatsData } from '@/components/stats/StatsView';
import { blockMeta, blockSummary } from '@/components/editor/blockTypes';
import {
  INAPP_LABEL,
  SOURCE_LABEL,
  classifyHost,
  deviceFromUA,
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
  const { user } = await getMyAccount();
  if (!user) notFound();

  const page = await getMyPage(params.pageId, user.id);
  if (!page) notFound();

  const range = resolveRange(searchParams.range, searchParams.from, searchParams.to, page.created_at);
  const startIso = new Date(range.startMs).toISOString();
  const endIso = new Date(range.endMs).toISOString();

  const [blocks, views, clicks] = await Promise.all([
    q(`SELECT id, type, data, position FROM bl_blocks WHERE page_id = $1 ORDER BY position`, [page.id]),
    q(
      `SELECT viewed_at, visitor_hash, referrer, referrer_source, device_type, inapp_app FROM bl_page_views
        WHERE page_id = $1 AND viewed_at BETWEEN $2 AND $3 ORDER BY viewed_at, id LIMIT 100000`,
      [page.id, startIso, endIso]
    ).then((r) => r.map(plain)),
    q(
      `SELECT block_id, created_at, referrer, referrer_source, user_agent FROM bl_click_events
        WHERE page_id = $1 AND created_at BETWEEN $2 AND $3 ORDER BY created_at, id LIMIT 100000`,
      [page.id, startIso, endIso]
    ).then((r) => r.map(plain)),
  ]);
  const viewsAvailable = true;

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
  const blockRows = blocks
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
    <main className="mx-auto max-w-[640px] px-4 pt-5">
      <StatsView data={data} />
    </main>
  );
}
