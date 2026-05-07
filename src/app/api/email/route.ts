import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'invalid body' }, { status: 400 });

  const { blockId, email, consent } = body;
  if (!blockId || !email) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 });
  }

  // 간단한 이메일 검증
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'invalid email' }, { status: 400 });
  }

  const supabase = createClient();

  const { data: block } = await supabase
    .from('blocks')
    .select('page_id, type')
    .eq('id', blockId)
    .maybeSingle();

  if (!block || block.type !== 'email') {
    return NextResponse.json({ error: 'invalid block' }, { status: 400 });
  }

  const { error } = await supabase.from('email_submissions').insert({
    block_id: blockId,
    page_id: block.page_id,
    email,
    consent: consent !== false,
  });

  if (error) {
    // unique 제약 위반은 OK (이미 등록한 이메일)
    if (error.code === '23505') {
      return NextResponse.json({ ok: true, alreadySubscribed: true });
    }
    console.error('이메일 수집 실패:', error);
    return NextResponse.json({ error: 'submission failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
