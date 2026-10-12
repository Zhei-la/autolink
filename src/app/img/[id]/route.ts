import { one } from '@/lib/server/db';

/** 올린 이미지 보여주기 (한 번 올린 이미지는 바뀌지 않으므로 오래 캐시) */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = String(params.id || '').replace(/\.[a-z]+$/i, '');
  if (!/^\d{1,18}$/.test(id)) return new Response('not found', { status: 404 });
  const row = await one<{ mime: string; data: Buffer }>(`SELECT mime, data FROM bl_images WHERE id = $1`, [id]);
  if (!row) return new Response('not found', { status: 404 });
  return new Response(new Uint8Array(row.data), {
    headers: {
      'Content-Type': row.mime,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
