import { NextResponse } from 'next/server';
import { buildVisitMeta, isBot } from '@/lib/tracking';
import { q } from '@/lib/server/db';
import { isUuid } from '@/lib/utils';

/**
 * 공개 페이지 방문 기록 (클라이언트에서 sendBeacon/fetch 로 호출)
 * body: { pageId, referrer, utm_source, utm_medium, utm_campaign }
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.pageId || !isUuid(String(body.pageId))) return NextResponse.json({ ok: false }, { status: 400 });

  const ua = request.headers.get('user-agent') || '';
  if (isBot(ua)) return NextResponse.json({ ok: true, skipped: 'bot' });

  const meta = buildVisitMeta(request.headers, body);

  try {
    const rows = await q(
      `INSERT INTO bl_page_views (page_id, visitor_hash, referrer, referrer_source, utm_source, utm_medium, utm_campaign, device_type, is_inapp_browser, inapp_app, user_agent)
       SELECT id, $2,$3,$4,$5,$6,$7,$8,$9,$10,$11 FROM bl_pages WHERE id = $1 AND is_published
       RETURNING page_id`,
      [body.pageId, meta.visitorHash, meta.referrer, meta.referrerSource, meta.utmSource, meta.utmMedium, meta.utmCampaign, meta.deviceType, meta.isInapp, meta.inappApp, meta.userAgent]
    );
    if (rows.length) await q(`UPDATE bl_pages SET view_count = view_count + 1 WHERE id = $1`, [body.pageId]);
  } catch (e) {
    console.error('방문 기록 실패:', e);
  }

  return NextResponse.json({ ok: true });
}
