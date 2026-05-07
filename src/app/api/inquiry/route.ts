import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'invalid body' }, { status: 400 });

  const { blockId, selectedOption } = body;
  if (!blockId || !selectedOption) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 });
  }

  const supabase = createClient();

  // block에서 page_id 가져오기
  const { data: block } = await supabase
    .from('blocks')
    .select('page_id, type')
    .eq('id', blockId)
    .maybeSingle();

  if (!block || block.type !== 'inquiry') {
    return NextResponse.json({ error: 'invalid block' }, { status: 400 });
  }

  const { error } = await supabase.from('inquiry_submissions').insert({
    block_id: blockId,
    page_id: block.page_id,
    selected_option: selectedOption,
  });

  if (error) {
    console.error('문의 제출 실패:', error);
    return NextResponse.json({ error: 'submission failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
