import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * 공개 페이지에서 링크 클릭 시 호출되는 추적 엔드포인트.
 * 1) click_events에 기록 + click_count 증가
 * 2) ?to= 파라미터의 실제 URL로 리다이렉트
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

  // 안전한 URL인지 검증 (http/https만)
  let safeUrl: string;
  try {
    const parsed = new URL(target);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('invalid protocol');
    }
    safeUrl = parsed.toString();
  } catch {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 });
  }

  // 클릭 기록 (실패해도 리다이렉트는 진행)
  try {
    const supabase = createClient();

    // block 정보 가져오기 (page_id 필요)
    const { data: block } = await supabase
      .from('blocks')
      .select('page_id')
      .eq('id', params.blockId)
      .maybeSingle();

    if (block) {
      await supabase.rpc('increment_block_clicks', {
        p_block_id: params.blockId,
        p_page_id: block.page_id,
      });
    }
  } catch (e) {
    console.error('클릭 추적 실패:', e);
  }

  // 실제 URL로 리다이렉트
  return NextResponse.redirect(safeUrl, { status: 302 });
}
