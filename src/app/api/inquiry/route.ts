import { NextResponse } from 'next/server';
import { one, q } from '@/lib/server/db';
import { isUuid } from '@/lib/utils';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'invalid body' }, { status: 400 });

  const { blockId } = body;
  const selectedOption = String(body.selectedOption || '').slice(0, 200);
  if (!blockId || !selectedOption || !isUuid(String(blockId))) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 });
  }

  const block = await one<{ page_id: string; type: string }>(`SELECT page_id, type FROM bl_blocks WHERE id = $1`, [blockId]);
  if (!block || block.type !== 'inquiry') {
    return NextResponse.json({ error: 'invalid block' }, { status: 400 });
  }

  try {
    await q(`INSERT INTO bl_inquiries (block_id, page_id, selected_option) VALUES ($1,$2,$3)`, [blockId, block.page_id, selectedOption]);
  } catch (e) {
    console.error('문의 제출 실패:', e);
    return NextResponse.json({ error: 'submission failed' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
