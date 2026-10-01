import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { appendRefParams, buildVisitMeta, isBot } from '@/lib/tracking';
import { normalizeUrl } from '@/lib/url';

/**
 * 공개 페이지에서 링크 클릭 시 호출되는 추적 엔드포인트.
 * 1) click_events 에 기록 (유입경로·UTM·디바이스·인앱 포함) + click_count 증가
 * 2) 목적지 URL 에 ?ref=bylink&block={blockId} 를 붙여 리다이렉트
 *
 * 쿼리:
 *   to   = 목적지 URL (필수)
 *   r    = document.referrer (클라이언트가 붙여줌, 선택)
 *   us/um/uc = 방문 당시 utm_source/medium/campaign (클라이언트가 붙여줌, 선택)
 */
export async function GET(
  request: Request,
  { params }: { params: { blockId: string } }
) {
  const url = new URL(request.url);
  const target = url.searchParams.get('to');

  if (!target) {
    return NextResponse.json({ error: 'missing to parameter' }, { status: 400 });
  }

  let safeUrl: string;
  try {
    // https:// 없이 저장된 예전 링크도 열리게 정리
    const parsed = new URL(normalizeUrl(target));
    if (!['http:', 'https:', 'tel:', 'mailto:'].includes(parsed.protocol)) throw new Error('invalid protocol');
    safeUrl = parsed.toString();
  } catch {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 });
  }

  const ua = request.headers.get('user-agent') || '';

  // 클릭 기록 (실패해도 리다이렉트는 진행)
  if (!isBot(ua)) {
    try {
      const supabase = createClient();
      const { data: block } = await supabase
        .from('blocks')
        .select('page_id')
        .eq('id', params.blockId)
        .maybeSingle();

      if (block) {
        const meta = buildVisitMeta(request.headers, {
          referrer: url.searchParams.get('r'),
          utm_source: url.searchParams.get('us'),
          utm_medium: url.searchParams.get('um'),
          utm_campaign: url.searchParams.get('uc'),
        });

        const { error } = await supabase.rpc('record_block_click', {
          p_block_id: params.blockId,
          p_page_id: block.page_id,
          p_visitor_hash: meta.visitorHash,
          p_referrer: meta.referrer,
          p_referrer_source: meta.referrerSource,
          p_utm_source: meta.utmSource,
          p_utm_medium: meta.utmMedium,
          p_utm_campaign: meta.utmCampaign,
          p_device_type: meta.deviceType,
          p_is_inapp: meta.isInapp,
          p_user_agent: meta.userAgent,
        });
        if (error) console.error('클릭 추적 실패:', error.message);
      }
    } catch (e) {
      console.error('클릭 추적 실패:', e);
    }
  }

  return NextResponse.redirect(appendRefParams(safeUrl, params.blockId), { status: 302 });
}
