import { NextResponse } from 'next/server';
import { one, q } from '@/lib/server/db';
import { isUuid } from '@/lib/utils';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'invalid body' }, { status: 400 });

  const { blockId, consent } = body;
  const email = String(body.email || '').trim().slice(0, 200);
  if (!blockId || !email || !isUuid(String(blockId))) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'invalid email' }, { status: 400 });
  }

  const block = await one<{ page_id: string; type: string }>(`SELECT page_id, type FROM bl_blocks WHERE id = $1`, [blockId]);
  if (!block || block.type !== 'email') {
    return NextResponse.json({ error: 'invalid block' }, { status: 400 });
  }

  try {
    const rows = await q(
      `INSERT INTO bl_emails (block_id, page_id, email, consent) VALUES ($1,$2,$3,$4)
       ON CONFLICT (block_id, email) DO NOTHING RETURNING id`,
      [blockId, block.page_id, email, consent !== false]
    );
    if (!rows.length) return NextResponse.json({ ok: true, alreadySubscribed: true });
  } catch (e) {
    console.error('이메일 수집 실패:', e);
    return NextResponse.json({ error: 'submission failed' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
