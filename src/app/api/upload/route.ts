import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { one } from '@/lib/server/db';
import { withBase } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const ALLOWED = new Set(['image/webp', 'image/png', 'image/jpeg', 'image/gif']);
const MAX = 8 * 1024 * 1024; // 브라우저에서 줄인 뒤라 보통 수백 KB

/** 이미지 올리기 → DB(bl_images)에 저장하고 /img/:id 주소를 돌려줌 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요해요' }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (!file || typeof file === 'string') return NextResponse.json({ error: '파일이 없어요' }, { status: 400 });
  if (!ALLOWED.has(file.type)) return NextResponse.json({ error: 'PNG·JPG·WEBP·GIF 만 올릴 수 있어요' }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: '이미지가 너무 커요 (8MB 이하)' }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const row = await one<{ id: string }>(`INSERT INTO bl_images (user_id, mime, data) VALUES ($1, $2, $3) RETURNING id`, [
    user.id,
    file.type,
    buf,
  ]);
  return NextResponse.json({ url: withBase(`/img/${row!.id}`) });
}
