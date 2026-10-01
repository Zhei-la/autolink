import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { buildVisitMeta, isBot } from '@/lib/tracking';

/**
 * 공개 페이지 방문 기록 (클라이언트에서 sendBeacon/fetch 로 호출)
 * body: { pageId, referrer, utm_source, utm_medium, utm_campaign }
 *
 * - 봇/크롤러는 제외
 * - visitor_hash 로 하루 단위 순 방문자 집계 가능
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.pageId) return NextResponse.json({ ok: false }, { status: 400 });

  const ua = request.headers.get('user-agent') || '';
  if (isBot(ua)) return NextResponse.json({ ok: true, skipped: 'bot' });

  const meta = buildVisitMeta(request.headers, body);

  try {
    const supabase = createClient();
    const { error } = await supabase.rpc('record_page_view', {
      p_page_id: body.pageId,
      p_visitor_hash: meta.visitorHash,
      p_referrer: meta.referrer,
      p_referrer_source: meta.referrerSource,
      p_utm_source: meta.utmSource,
      p_utm_medium: meta.utmMedium,
      p_utm_campaign: meta.utmCampaign,
      p_device_type: meta.deviceType,
      p_is_inapp: meta.isInapp,
      p_inapp_app: meta.inappApp,
      p_user_agent: meta.userAgent,
    });
    if (error) console.error('방문 기록 실패:', error.message);
  } catch (e) {
    console.error('방문 기록 실패:', e);
  }

  return NextResponse.json({ ok: true });
}
