import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { getMyAccount } from '@/lib/db/account';
import { one, q, tx } from '@/lib/server/db';
import { classifyHost } from '@/lib/analytics';
import { normalizeUrl } from '@/lib/url';

export const dynamic = 'force-dynamic';

/**
 * 다른 서비스(리틀리 등)에서 쓰던 방문·클릭 기록을 옮겨 오기 — 통계가 끊기지 않게
 * body: {
 *   slug, wipe?: true,              // wipe: 이 페이지의 기존 기록을 지우고 넣기
 *   views:  [{ day:'YYYY-MM-DD', n, ref? }],   // ref: 'https://l.threads.com/' 같은 유입 주소
 *   clicks: [{ day, url, n, ref? }],           // url: 눌린 버튼의 목적지 주소
 *   repeats?: number                // 재방문 수 (그만큼은 같은 방문자로 셈)
 * }
 */
function pickTime(day: string): string {
  // 한국 시간 09:00~23:30 사이 아무 때나 (오늘이면 지금보다 전으로)
  const start = Date.parse(`${day}T09:00:00+09:00`);
  let end = Date.parse(`${day}T23:30:00+09:00`);
  end = Math.min(end, Date.now() - 5 * 60 * 1000);
  const t = end > start ? start + Math.random() * (end - start) : Math.min(start, Date.now() - 60 * 1000);
  return new Date(t).toISOString();
}

function urlKey(u?: string | null): string {
  if (!u) return '';
  try {
    const x = new URL(normalizeUrl(u));
    return (x.host.replace(/^www\./, '') + x.pathname.replace(/\/$/, '')).toLowerCase();
  } catch {
    return String(u).toLowerCase();
  }
}

export async function POST(request: Request) {
  const { user } = await getMyAccount();
  if (!user) return NextResponse.json({ error: '로그인이 필요해요' }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body?.slug) return NextResponse.json({ error: '주소가 없어요' }, { status: 400 });

  const page = await one<{ id: string }>(`SELECT id FROM bl_pages WHERE slug = $1 AND user_id = $2`, [
    String(body.slug).toLowerCase(),
    user.id,
  ]);
  if (!page) return NextResponse.json({ error: '내 페이지가 아니에요' }, { status: 404 });

  // 목적지 주소 → 블록 찾기 (버튼 · 버튼 묶음 안 버튼)
  const blocks = await q(`SELECT id, type, data FROM bl_blocks WHERE page_id = $1`, [page.id]);
  const byUrl = new Map<string, { blockId: string; url: string }>();
  for (const b of blocks) {
    if (b.type === 'link' && b.data?.url) byUrl.set(urlKey(b.data.url), { blockId: b.id, url: normalizeUrl(b.data.url) });
    if (b.type === 'link_collection') {
      for (const it of b.data?.links || []) if (it?.url) byUrl.set(urlKey(it.url), { blockId: b.id, url: normalizeUrl(it.url) });
    }
  }

  const views: any[] = Array.isArray(body.views) ? body.views : [];
  const clicks: any[] = Array.isArray(body.clicks) ? body.clicks : [];
  const totalViews = views.reduce((s, v) => s + Math.max(0, Math.floor(v.n || 0)), 0);
  const totalClicks = clicks.reduce((s, v) => s + Math.max(0, Math.floor(v.n || 0)), 0);
  if (totalViews > 20000 || totalClicks > 20000) return NextResponse.json({ error: '너무 많아요' }, { status: 400 });
  const unknown = clicks.filter((c) => !byUrl.has(urlKey(c.url))).map((c) => c.url);
  if (unknown.length) return NextResponse.json({ error: '페이지에 없는 버튼 주소가 있어요', unknown: [...new Set(unknown)] }, { status: 400 });

  const repeats = Math.max(0, Math.min(totalViews, Math.floor(body.repeats || 0)));
  const repeatEvery = repeats ? Math.max(1, Math.floor(totalViews / repeats)) : 0;
  const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Barcelona (옮겨온 기록)';
  const hash = () => 'imp_' + randomBytes(8).toString('hex');

  const result = await tx(async (run) => {
    if (body.wipe === true) {
      await run(`DELETE FROM bl_page_views WHERE page_id = $1`, [page.id]);
      await run(`DELETE FROM bl_click_events WHERE page_id = $1`, [page.id]);
      await run(`UPDATE bl_blocks SET click_count = 0 WHERE page_id = $1`, [page.id]);
      await run(`UPDATE bl_pages SET view_count = 0 WHERE id = $1`, [page.id]);
    }
    const visitors: string[] = [];
    let i = 0;
    for (const v of views) {
      const ref = v.ref ? String(v.ref).slice(0, 500) : null;
      let host: string | null = null;
      try {
        host = ref ? new URL(ref).host : null;
      } catch {}
      const src = classifyHost(host);
      for (let k = 0; k < Math.floor(v.n || 0); k++, i++) {
        const reuse = repeatEvery && i > 0 && i % repeatEvery === 0 && visitors.length && visitors.length + 0 < totalViews;
        const vh = reuse ? visitors[Math.floor(Math.random() * visitors.length)] : hash();
        if (!reuse) visitors.push(vh);
        await run(
          `INSERT INTO bl_page_views (page_id, viewed_at, visitor_hash, referrer, referrer_source, device_type, is_inapp_browser, inapp_app, user_agent)
           VALUES ($1,$2,$3,$4,$5,'mobile',$6,$7,$8)`,
          [page.id, pickTime(v.day), vh, ref, src, src === 'threads' || src === 'facebook', src === 'threads' ? 'threads' : src === 'facebook' ? 'facebook' : null, ua]
        );
      }
    }
    for (const c of clicks) {
      const target = byUrl.get(urlKey(c.url))!;
      const ref = c.ref ? String(c.ref).slice(0, 500) : 'https://l.threads.com/';
      for (let k = 0; k < Math.floor(c.n || 0); k++) {
        await run(
          `INSERT INTO bl_click_events (block_id, page_id, created_at, visitor_hash, referrer, referrer_source, device_type, is_inapp_browser, user_agent, target_url)
           VALUES ($1,$2,$3,$4,$5,'threads','mobile',true,$6,$7)`,
          [target.blockId, page.id, pickTime(c.day), visitors.length ? visitors[Math.floor(Math.random() * visitors.length)] : hash(), ref, ua, target.url]
        );
      }
      await run(`UPDATE bl_blocks SET click_count = click_count + $1 WHERE id = $2`, [Math.floor(c.n || 0), target.blockId]);
    }
    await run(`UPDATE bl_pages SET view_count = view_count + $1 WHERE id = $2`, [totalViews, page.id]);
    return { views: totalViews, clicks: totalClicks, visitors: visitors.length };
  });

  return NextResponse.json({ ok: true, ...result });
}
