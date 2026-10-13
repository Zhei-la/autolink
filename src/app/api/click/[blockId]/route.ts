import { one, q } from '@/lib/server/db';
import { isUuid } from '@/lib/utils';
import { viewerUid } from '@/lib/server/auth';
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
      const block = isUuid(params.blockId)
        ? await one<{ page_id: string; user_id: number }>(
            `SELECT b.page_id, p.user_id FROM bl_blocks b JOIN bl_pages p ON p.id = b.page_id WHERE b.id = $1`,
            [params.blockId]
          )
        : null;

      // 페이지 주인이 직접 누른 건 세지 않음
      if (block && block.user_id !== viewerUid(request)) {
        const meta = buildVisitMeta(request.headers, {
          referrer: url.searchParams.get('r'),
          utm_source: url.searchParams.get('us'),
          utm_medium: url.searchParams.get('um'),
          utm_campaign: url.searchParams.get('uc'),
        });
        await q(
          `INSERT INTO bl_click_events (block_id, page_id, visitor_hash, referrer, referrer_source, utm_source, utm_medium, utm_campaign, device_type, is_inapp_browser, user_agent, target_url)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          [params.blockId, block.page_id, meta.visitorHash, meta.referrer, meta.referrerSource, meta.utmSource, meta.utmMedium, meta.utmCampaign, meta.deviceType, meta.isInapp, meta.userAgent, safeUrl.slice(0, 1000)]
        );
        await q(`UPDATE bl_blocks SET click_count = click_count + 1 WHERE id = $1`, [params.blockId]);
      }
    } catch (e) {
      console.error('클릭 추적 실패:', e);
    }
  }

  return NextResponse.redirect(appendRefParams(safeUrl, params.blockId), { status: 302 });
}
